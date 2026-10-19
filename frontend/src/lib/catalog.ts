import { toCents, type Product, type SortOrder } from "./contracts";

const collator = new Intl.Collator("pt-BR", { sensitivity: "base", numeric: true });
const searchable = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");

export function selectCatalog(products: Product[], options: {
  query: string; minPrice: string; maxPrice: string; sort: SortOrder; page: number; pageSize: number;
}) {
  const min = options.minPrice.trim() ? toCents(options.minPrice) : 0;
  const max = options.maxPrice.trim() ? toCents(options.maxPrice) : Infinity;
  const error = min === null || max === null ? "Informe preços válidos, com até duas casas decimais."
    : min > max ? "O preço mínimo não pode ser maior que o máximo." : null;
  const filtered = error ? [] : products.filter((product) => {
    const price = toCents(product.price)!;
    return searchable(product.name).includes(searchable(options.query.trim())) && price >= min! && price <= max!;
  });
  const direction = options.sort.endsWith("desc") ? -1 : 1;
  const sorted = [...filtered].sort((a, b) => {
    const compared = options.sort.startsWith("name") ? collator.compare(a.name, b.name) : toCents(a.price)! - toCents(b.price)!;
    return compared * direction || a.id - b.id;
  });
  const totalPages = Math.max(1, Math.ceil(sorted.length / options.pageSize));
  const page = Math.min(Math.max(1, options.page), totalPages);
  return { items: sorted.slice((page - 1) * options.pageSize, page * options.pageSize), sorted,
    total: sorted.length, totalPages, page, error };
}
