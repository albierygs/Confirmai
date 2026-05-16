import cron from "node-cron";
import { expirarAssinaturas } from "../services/assinaturaService";

// Executar diariamente às 03:00 AM
export const startSubscriptionExpirationJob = () => {
  cron.schedule("0 3 * * *", async () => {
    console.log("📋 Executando verificação de assinaturas...");

    try {
      const result = await expirarAssinaturas();

      if (result.pastDue > 0 || result.expired > 0 || result.canceled > 0) {
        console.log(
          `✅ Assinaturas atualizadas: ${result.pastDue} past_due, ${result.expired} expiradas, ${result.canceled} canceladas`,
        );
      }
    } catch (error) {
      console.error("❌ Erro na verificação de assinaturas:", error);
    }
  });

  console.log("⏰ Job de expiração de assinaturas iniciado (diário 03:00)");
};
