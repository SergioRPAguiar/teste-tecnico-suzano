import { expect, test } from "@playwright/test";

test("interface real autentica, cadastra e consulta o produto no PostgreSQL", async ({ page, request }) => {
  const apiUrl = process.env.E2E_API_URL ?? "http://localhost:3001";
  const publicApiUrl = process.env.E2E_PUBLIC_API_URL ?? "http://localhost:3001";
  const publicWebUrl = process.env.E2E_PUBLIC_WEB_URL ?? "http://localhost:3000";
  const username = process.env.ADMIN_USERNAME ?? "admin";
  const password = process.env.ADMIN_PASSWORD ?? "Suzano@123";
  const name = `Produto integração real ${Date.now()}`;
  const login = await request.post(`${apiUrl}/auth/login`, { data: { username, password } });
  expect(login.ok()).toBeTruthy();
  const { accessToken } = await login.json();
  if (process.env.E2E_API_URL) await page.route(`${publicApiUrl}/**`, (route) => route.continue({ url: route.request().url().replace(publicApiUrl, apiUrl) }));
  if (process.env.E2E_BASE_URL) await page.route(`${publicWebUrl}/images/**`, (route) => route.continue({ url: route.request().url().replace(publicWebUrl, process.env.E2E_BASE_URL!) }));
  try {
    await page.goto("/");
    await expect(page.getByText("API real", { exact: true })).toBeVisible();
    await expect(page.getByTestId("product-card").first()).toBeVisible();
    const photo = page.getByTestId("product-card").first().locator("img");
    await expect(photo).toHaveAttribute("src", /\/images\/notas\.jpg$/);
    await expect.poll(() => photo.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
    await page.getByRole("button", { name: "Novo produto", exact: true }).click();
    await page.getByLabel("Usuário", { exact: true }).fill(username);
    await page.getByLabel("Senha", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Entrar", exact: true }).last().click();
    await page.getByLabel("Nome do produto").fill(name);
    await page.getByRole("textbox", { name: "Categoria", exact: true }).fill("Integração");
    await page.getByRole("textbox", { name: "Preço (R$)", exact: true }).fill("19,90");
    await page.getByLabel("Estoque inicial").fill("5");
    await page.getByRole("textbox", { name: "Descrição", exact: true }).fill("Criado pela interface com API e banco reais.");
    await page.getByRole("button", { name: "Salvar produto", exact: true }).click();
    await expect(page.getByTestId("product-card").filter({ hasText: name })).toBeVisible();
    const products = await (await request.get(`${apiUrl}/products`)).json();
    expect(products.find((product: { name: string }) => product.name === name)?.price).toBe("19.90");
  } finally {
    const products = await (await request.get(`${apiUrl}/products`)).json();
    for (const product of products.filter((item: { name: string }) => item.name === name)) {
      const deleted = await request.delete(`${apiUrl}/products/${product.id}`, { headers: { Authorization: `Bearer ${accessToken}` } });
      expect(deleted.status()).toBe(204);
    }
  }
});

test("erro de conexão é recuperável e carregamento fica visível durante a nova tentativa", async ({ page }) => {
  const apiUrl = process.env.E2E_API_URL ?? "http://localhost:3001";
  const publicApiUrl = process.env.E2E_PUBLIC_API_URL ?? "http://localhost:3001";
  let fail = true;
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  await page.route(`${publicApiUrl}/products`, async (route) => {
    if (fail) { await route.abort(); return; }
    await gate;
    await route.continue({ url: `${apiUrl}/products` });
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Não foi possível carregar o catálogo" })).toBeVisible();
  fail = false;
  await page.getByRole("button", { name: "Tentar novamente" }).click();
  await expect(page.getByLabel("Carregando produtos")).toBeVisible();
  release();
  await expect(page.getByTestId("product-card").first()).toBeVisible();
});
