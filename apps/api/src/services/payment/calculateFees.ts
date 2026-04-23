import Decimal from "decimal.js";
import { getPaymentMethod } from "./getPaymentMethod.js";
import { getPaymentProvider } from "./getPaymentProvider.js";

interface InstallmentOption {
  number: number;
  value: number;
  total: number;
  interestRate: number;
  hasInterest: boolean;
}

interface FeeCalculation {
  subtotal: Decimal;
  platformFee: Decimal;
  gatewayFee: Decimal;
  tenantReceives: Decimal;
  total: Decimal;
  installments?: InstallmentOption[];
}

export const calculateFees = async (
  providerSlug: string,
  paymentMethodSlug: string,
  subtotal: Decimal,
): Promise<FeeCalculation> => {
  // Buscar provider e método
  const provider = await getPaymentProvider(providerSlug);
  const method = await getPaymentMethod(provider.id, paymentMethodSlug);

  // 1. Calcular comissão da plataforma (sobre o subtotal)
  const platformFeePercent = provider.platformFeePercent.plus(
    provider.platformCoustPercent,
  );
  const platformFee = subtotal.mul(platformFeePercent).div(100);

  // 2. Total é igual ao subtotal (cliente não paga taxa adicional)
  const total = subtotal;

  // 3. Calcular taxa do gateway (sobre o total pago)
  const gatewayFeePercent = new Decimal(method.gatewayFeePercent);
  const gatewayFeeFixed = new Decimal(method.gatewayFeeFixed);
  const gatewayFee = total
    .mul(gatewayFeePercent)
    .div(100)
    .plus(gatewayFeeFixed);

  // 4. O que o tenant recebe = total - comissão da plataforma - taxa do gateway
  const tenantReceives = total.minus(platformFee).minus(gatewayFee);

  // 5. Calcular parcelamento (se aplicável)
  let installments: InstallmentOption[] | undefined;

  if (method.allowInstallments) {
    installments = calculateInstallments(
      total,
      method.maxInstallments,
      new Decimal(method.minInstallmentValue),
      method.interestFree,
      new Decimal(method.interestRate),
    );
  }

  return {
    subtotal,
    platformFee,
    gatewayFee,
    tenantReceives,
    total,
    installments,
  };
};

const calculateInstallments = (
  total: Decimal,
  maxInstallments: number,
  minInstallmentValue: Decimal,
  interestFree: number,
  monthlyInterestRate: Decimal,
): InstallmentOption[] => {
  const options: InstallmentOption[] = [];
  const interestRateDecimal = monthlyInterestRate.div(100);

  for (let i = 1; i <= maxInstallments; i++) {
    // Verificar valor mínimo da parcela
    const installmentValue = total.div(i);
    if (installmentValue.lessThan(minInstallmentValue)) {
      break;
    }

    const hasInterest = i > interestFree;
    let finalInstallmentValue: Decimal;
    let finalTotal: Decimal;

    if (hasInterest) {
      // Cálculo Price: M = P * [(1+i)^n * i] / [(1+i)^n - 1]
      const factor = interestRateDecimal.plus(1).pow(i);
      const numerator = factor.mul(interestRateDecimal);
      const denominator = factor.minus(1);

      finalInstallmentValue = total.mul(numerator).div(denominator);
      finalTotal = finalInstallmentValue.mul(i);
    } else {
      // Sem juros
      finalInstallmentValue = total.div(i);
      finalTotal = total;
    }

    options.push({
      number: i,
      value: finalInstallmentValue.toNumber(),
      total: finalTotal.toNumber(),
      interestRate: hasInterest ? monthlyInterestRate.toNumber() : 0,
      hasInterest,
    });
  }

  return options;
};
