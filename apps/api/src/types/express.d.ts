declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        nome: string;
        email: string;
        cargo: "admin" | "membro" | "global_admin";
        tenant?: {
          id: string | null;
        };
      };
      tenant?: {
        id: string;
        nome: string;
        slug: string;
        status: "ativo" | "cancelado" | "suspenso";
      };
      subscription?: {
        id: string;
        planId: string;
        status: string;
        endDate: Date;
      };
    }
  }
}

export {};
