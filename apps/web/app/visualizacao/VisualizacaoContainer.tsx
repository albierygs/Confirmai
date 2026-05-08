"use client"

import { useState } from 'react';
import DashboardHeader from "@/components/visualizacao/DashboardHeader";
import Input from "@/components/visualizacao/Input";
import FormTable from '@/components/visualizacao/FormTable';
import { ResponseItem } from "@/../../apps/api/src/types/formularios"

export default function VisualizacaoContainer()
{

    const [formulariosAtivos,setFormulariosAtivos] = useState(0);
    const [inscricoes,setInscricoes] = useState(0);
    const [processosAtivos,setProcessosAtivos] = useState(0);
    const [formularios, setFormularios] = useState<ResponseItem[]>([]);

    return(
        <>
            <DashboardHeader formulariosAtivos={formulariosAtivos} inscricoes={inscricoes} processosAtivos={processosAtivos}/>
            <Input />
            <FormTable formulariosInfo={formularios}></FormTable>
        </>
    );
}