type Props = {
    info: number;
    textDisplay: string;
}

export default function HeaderBox({ info, textDisplay }: Props) {
  return (
    <div className="flex flex-col aspect-square w-[20%] max-w-60 bg-amber-50 rounded-3xl justify-center items-center p-4">
      
      <h1 className="text-black text-[clamp(0.8rem,2vw,10rem)]">{info}</h1>

      <h1 className="text-black text-[1.5vw] wrap-break-word text-left w-full">
        {textDisplay}
      </h1>

    </div>
  );
}