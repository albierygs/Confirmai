import { Paytone_One } from 'next/font/google';
import HeaderBox from '@/components/visualizacao/HeaderBox'

const paytone = Paytone_One({
  subsets: ['latin'],
  weight: '400',
});

type Props = {
    formulariosAtivos : number,
    inscricoes : number,
    processosAtivos : number
}

export default function DashboardHeader({formulariosAtivos,inscricoes,processosAtivos} : Props) {
  return (
    <div className="flex flex-col items-center justify-center w-full mt-[0.5vh]">
      
      <h1 className={`${paytone.className} text-[clamp(1.2rem,5vw,3rem)] text-center`}>
        Visualização das respostas recebidas
      </h1>

      <div className="flex flex-row items-center justify-center w-[80%] mt-6 gap-x-[5vw] flex-wrap">
        <HeaderBox info={formulariosAtivos} textDisplay='Formulários Ativos'/>
        <HeaderBox info={inscricoes} textDisplay='Inscrições Recebidas'/>
        <HeaderBox info={processosAtivos} textDisplay='Processos em Andamento'/>
      </div>

    </div>
  );
}