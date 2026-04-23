import cron from "node-cron";
import { cleanExpiredReservations } from "../services/reservaService";

// Executar a cada 5 minutos
export const startReservationCleanupJob = () => {
  cron.schedule("*/5 * * * *", async () => {
    console.log("🧹 Executando limpeza de reservas...");

    try {
      const cleaned = await cleanExpiredReservations();

      if (cleaned > 0) {
        console.log(`✅ ${cleaned} reservas expiradas removidas`);
      }
    } catch (error) {
      console.error("❌ Erro na limpeza de reservas:", error);
    }
  });

  console.log("⏰ Job de limpeza de reservas iniciado");
};
