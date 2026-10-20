import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("product-card").first()).toBeVisible();
  await expect(page.getByRole("button", { name: /^Editar / })).toHaveCount(0);
  const image = page.getByTestId("product-card").first().locator("img");
  await expect(image).toHaveAttribute("src", /\/images\/notas\.jpg$/);
  await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBe(true);
});

test("combina filtros, ordena antes de paginar e oferece 10/20/50/100", async ({ page }) => {
  await expect(page.getByTestId("product-card")).toHaveCount(10);
  await page.getByLabel("Próxima página", { exact: true }).click();
  await expect(page.getByRole("button", { name: "Página 2", exact: true })).toHaveAttribute("aria-current", "page");
  await page.getByLabel("Buscar por nome").fill("PAPEL A4");
  await expect(page.getByTestId("product-card")).toHaveCount(4);
  await expect(page.getByRole("button", { name: "Página 1", exact: true })).toHaveAttribute("aria-current", "page");
  await page.getByLabel("Preço mínimo (R$)").fill("27,90");
  await page.getByLabel("Preço máximo (R$)").fill("30,90");
  await page.getByLabel("Ordenar por").selectOption("price-desc");
  await expect(page.getByTestId("product-card")).toHaveCount(2);
  await expect(page.getByTestId("product-card").first()).toContainText("pacote 3");
  await page.getByRole("button", { name: "Limpar filtros", exact: true }).click();
  for (const [size, count] of [["20", 20], ["50", 48], ["100", 48], ["10", 10]] as const) {
    await page.getByLabel("Produtos por página").selectOption(size);
    await expect(page.getByTestId("product-card")).toHaveCount(count);
  }
});

test("cadastro autenticado limpa filtro, mantém ordem e exibe o novo produto", async ({ page }) => {
  await page.getByLabel("Buscar por nome").fill("Papel A4");
  await page.getByLabel("Ordenar por").selectOption("price-asc");
  await page.getByRole("button", { name: "Novo produto", exact: true }).click();
  await page.getByRole("button", { name: "Usar acesso de demonstração" }).click();
  await expect(page.getByRole("heading", { name: "Cadastrar produto" })).toBeVisible();
  await page.getByLabel("Nome do produto").fill("Produto recém-cadastrado");
  await page.getByRole("textbox", { name: "Categoria", exact: true }).fill("Papéis");
  await page.getByRole("textbox", { name: "Preço (R$)", exact: true }).fill("10");
  await page.getByLabel("Estoque inicial").fill("0");
  await page.getByRole("textbox", { name: "Descrição", exact: true }).fill("Cadastro de verificação do fluxo completo.");
  await page.getByRole("button", { name: "Salvar produto", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Cadastrar produto" })).not.toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "Produto cadastrado com sucesso" })).toBeVisible();
  await expect(page.getByLabel("Buscar por nome")).toHaveValue("");
  await expect(page.getByLabel("Ordenar por")).toHaveValue("price-asc");
  const card = page.getByTestId("product-card").filter({ hasText: "Produto recém-cadastrado" });
  await expect(card).toBeVisible();
  await expect(card).toContainText("Sem estoque");
  await expect(card).toContainText("0,10");
  await page.reload();
  await page.getByLabel("Buscar por nome").fill("Produto recém-cadastrado");
  await expect(page.getByTestId("product-card")).toHaveCount(1);
});

test("informa erros de formulário e intervalo inválido", async ({ page }) => {
  await page.getByLabel("Preço mínimo (R$)").fill("100");
  await page.getByLabel("Preço máximo (R$)").fill("1");
  await expect(page.getByRole("alert").filter({ hasText: "mínimo não pode ser maior" })).toBeVisible();
  await page.getByRole("button", { name: "Novo produto", exact: true }).click();
  await page.getByRole("button", { name: "Usar acesso de demonstração" }).click();
  await page.getByRole("button", { name: "Salvar produto", exact: true }).click();
  await expect(page.getByText("Preencha este campo.").first()).toBeVisible();
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
});

test("formulário móvel aceita categoria livre, mantém foco e permite cancelar sem salvar", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.getByRole("button", { name: "Novo produto", exact: true }).click();
  await page.screenshot({ path: test.info().outputPath("acesso-mobile.png") });
  await page.getByRole("button", { name: "Usar acesso de demonstração" }).click();
  const dialog = page.getByRole("dialog", { name: "Cadastrar produto", exact: true });
  await expect(page.getByLabel("Nome do produto")).toBeFocused();
  await page.getByLabel("Nome do produto").fill("Rascunho preservado");
  const category = page.getByRole("textbox", { name: "Categoria", exact: true });
  await category.fill("Categoria personalizada");
  await expect(page.getByRole("combobox", { name: "Categoria", exact: true })).toHaveCount(0);
  await expect(page.getByLabel("Nome do produto")).toHaveValue("Rascunho preservado");
  for (const width of [320, 375, 768]) {
    await page.setViewportSize({ width, height: 812 });
    expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  }
  await page.setViewportSize({ width: 375, height: 812 });
  await page.screenshot({ path: test.info().outputPath("cadastro-mobile.png") });
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await page.getByRole("button", { name: "Novo produto", exact: true }).click();
  await expect(category).toHaveValue("");
  await expect(page.getByLabel("Nome do produto")).toHaveValue("");
});

test("preço desloca centavos, valida limites e preserva categoria e rascunho após401", async ({ page }) => {
  await page.getByRole("button", { name: "Novo produto", exact: true }).click();
  await page.getByRole("button", { name: "Usar acesso de demonstração" }).click();
  await page.getByLabel("Nome do produto").fill("Produto com centavos");
  await page.getByRole("textbox", { name: "Categoria", exact: true }).fill("Material de apoio");
  await page.getByLabel("Estoque inicial").fill("4");
  await page.getByRole("textbox", { name: "Descrição", exact: true }).fill("Cadastro com entrada monetária em centavos.");
  const price = page.getByRole("textbox", { name: "Preço (R$)", exact: true });
  await expect(price).toHaveValue("00,00");
  for (const [digit, expected] of [["1", "00,01"], ["2", "00,12"], ["5", "01,25"], ["9", "12,59"], ["9", "125,99"]]) {
    await price.pressSequentially(digit!);
    await expect(price).toHaveValue(expected!);
  }
  await page.screenshot({ path: test.info().outputPath("preco-centavos.png") });
  await price.press("Backspace"); await expect(price).toHaveValue("12,59");
  await price.fill(""); await expect(price).toHaveValue("00,00");
  await page.getByRole("button", { name: "Salvar produto", exact: true }).click();
  await expect(page.getByText("Informe um preço positivo", { exact: false })).toBeVisible();
  await price.fill("1000000000000");
  await page.getByRole("button", { name: "Salvar produto", exact: true }).click();
  await expect(price).toHaveAttribute("aria-invalid", "true");
  await price.fill("12599");
  await page.evaluate(() => {
    const original = window.fetch;
    window.fetch = (input, init) => {
      if (init?.method === "POST" && String(input).endsWith("/products")) {
        window.fetch = original;
        return Promise.resolve(new Response(JSON.stringify({ message: "Token expirado." }), { status: 401, headers: { "Content-Type": "application/json" } }));
      }
      return original(input, init);
    };
  });
  await page.getByRole("button", { name: "Salvar produto", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Acesso administrativo", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Usar acesso de demonstração" }).click();
  await expect(page.getByRole("heading", { name: "Cadastrar produto", exact: true })).toBeVisible();
  await expect(price).toHaveValue("125,99");
  await expect(page.getByRole("textbox", { name: "Categoria", exact: true })).toHaveValue("Material de apoio");
  const post = page.waitForRequest((request) => request.method() === "POST" && request.url().endsWith("/products"));
  await page.getByRole("button", { name: "Salvar produto", exact: true }).click();
  expect((await post).postDataJSON()).toMatchObject({ name: "Produto com centavos", category: "Material de apoio", price: "125.99", stockQuantity: 4 });
  const card = page.getByTestId("product-card").filter({ hasText: "Produto com centavos" });
  await expect(card).toContainText("Material de apoio");
  await expect(card).toContainText("125,99");
  await expect(card).toContainText("4 em estoque");
});

test("tela vazia é recuperável e layout móvel não transborda", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.getByLabel("Buscar por nome").fill("produto que não existe");
  await expect(page.getByRole("heading", { name: "Nenhum produto encontrado" })).toBeVisible();
  await page.getByRole("button", { name: "Limpar busca" }).click();
  await expect(page.getByTestId("product-card")).toHaveCount(10);
  for (const width of [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 812 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
  await page.setViewportSize({ width: 375, height: 812 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: test.info().outputPath("catalogo-mobile.png"), fullPage: true });
});

test("imagem indisponível usa fallback local", async ({ page }) => {
  await page.route("**/product-placeholder.svg", async (route) => route.fulfill({ status: 200, contentType: "image/svg+xml", body: '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="green"/></svg>' }));
  const image = page.getByTestId("product-card").first().locator("img");
  await image.evaluate((element: HTMLImageElement) => { element.src = "/imagem-inexistente.png"; });
  await expect(image).toHaveAttribute("src", "/product-placeholder.svg");
});

test("snapshot de tela desktop", async ({ page }) => {
  test.skip(process.platform !== "linux", "Referência visual gerada no container Playwright Linux fixado; ver README.");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => Array.from(document.images).every((image) => image.complete));
  await expect(page).toHaveScreenshot("catalogo-desktop.png", { fullPage: true, animations: "disabled", maxDiffPixelRatio: 0.005 });
});
