import app from "./app";
import { PORT } from "./config/constants";
import seed from "./config/seed";
import { startJobs } from "./jobs";

app.listen(PORT, async (error) => {
  if (error) {
    console.warn(`Falha ao iniciar servidor na porta ${PORT}`);
  }
  await seed();
  startJobs();
  console.info(`Servidor rodando na porta ${PORT}`);
});
