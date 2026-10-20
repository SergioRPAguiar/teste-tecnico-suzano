import { toApiPrice } from "./contracts";
import { formatPriceInput, priceDigitsToApi, readPriceDigits } from "./price-input";

describe("Entrada de preço por centavos", () => {
  it.each([
    ["0", "00,00", "0.00"], ["1", "00,01", "0.01"], ["12", "00,12", "0.12"],
    ["125", "01,25", "1.25"], ["1259", "12,59", "12.59"], ["12599", "125,99", "125.99"],
    ["999999999999", "9999999999,99", "9999999999.99"],
  ])("exibe os centavos %s como %s e envia %s", (digits, display, api) => {
    expect(formatPriceInput(digits!)).toBe(display);
    expect(priceDigitsToApi(digits!)).toBe(api);
  });
  it("aceita valor colado formatado e remove somente zeros de preenchimento", () => {
    expect(readPriceDigits("R$ 1.234,56")).toBe("123456");
    expect(readPriceDigits("00,01")).toBe("1");
    expect(readPriceDigits("")).toBe("0");
  });
  it.each(["-1,25", "1e2", "abc", "Infinity"])("não transforma entrada inválida em outro preço: %s", (value) => {
    expect(readPriceDigits(value)).toBeNull();
  });
  it("mantém visível o valor acima do limite para rejeitá-lo sem truncar ou arredondar", () => {
    const value = priceDigitsToApi(readPriceDigits("1000000000000")!);
    expect(value).toBe("10000000000.00");
    expect(toApiPrice(value)).toBeNull();
    expect(toApiPrice(priceDigitsToApi("0"))).toBeNull();
  });
});
