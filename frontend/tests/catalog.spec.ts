import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("product-card").first()).toBeVisible();
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
  await page.getByRole("textbox", { name: "Preço (R$)", exact: true }).fill("0,10");
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

test("tela vazia é recuperável e layout móvel não transborda", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.getByLabel("Buscar por nome").fill("produto que não existe");
  await expect(page.getByRole("heading", { name: "Nenhum produto encontrado" })).toBeVisible();
  await page.getByRole("button", { name: "Limpar busca" }).click();
  await expect(page.getByTestId("product-card")).toHaveCount(10);
  for (const width of [320, 375, 768]) {
    await page.setViewportSize({ width, height: 812 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
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
