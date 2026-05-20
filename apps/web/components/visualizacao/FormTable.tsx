import { propagateServerField } from "next/dist/server/lib/render-server";
import { useEffect, useState } from "react";
import { ResponseItem } from "@/../../apps/api/src/types/formularios"

type Props = {
    formulariosInfo : ResponseItem
}

export default function FormTable({formulariosInfo} : Props  ) {


    const headers = ["ID", "Nome", "E-mail", "Curso", "Data", "Status"];

    useEffect(() => {

    },[])

    const [responseData,setResponseData] = useState<ResponseItem[]>([
        {
            id: "1",
            nome: "Karen",
            email: "emailmuitograndequepodequebrar@example.com",
            curso: "Matemática Aplicada e Computacional",
            data: new Date(),
            status: "Ativo"
        }
    ]);

    return (
        <div className="flex justify-center w-full h-full">

            <div className="w-[80%] bg-amber-50 rounded-2xl overflow-hidden border ">

                {/* HEADER */}
                <div className="grid grid-cols-6 bg-red-600 h-12 text-white font-bold text-xs sm:text-sm md:text-base divide-x divide-black">

                    {headers.map((title, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-center h-full tracking-wide"
                        >
                            {title}
                        </div>
                    ))}

                </div>

                {/* BODY */}
                {responseData.map((item) => (
                    <div
                        key={item.id}
                        className="grid grid-cols-6 border-t border-amber-200 text-center items-center text-black text-xs sm:text-sm md:text-base hover:bg-amber-100 "
                    >
                        <div className="p-2 break-words overflow-hidden text-[clamp(0.45rem,0.45rem,1rem)]">{item.id}</div>
                        <div className="p-2 break-words overflow-hidden text-[clamp(0.45rem,0.45rem,1rem)]">{item.nome}</div>
                        <div className="p-2 break-words overflow-hidden text-[clamp(0.45rem,0.45rem,1rem)]">{item.email}</div>
                        <div className="p-2 break-words overflow-hidden text-[clamp(0.45rem,0.45rem,1rem)]">{item.curso}</div>
                        <div className="p-2 break-words overflow-hidden text-[clamp(0.45rem,0.45rem,1rem)]">
                            {item.data.toDateString()}
                        </div>
                        <div className="p-2 break-words text-[clamp(0.45rem,0.45rem,1rem)] overflow-hidden">{item.status}</div>
                    </div>
                ))}
 text-[clamp(0.75rem,1vw,1rem)]
            </div>
        </div>
    );
}