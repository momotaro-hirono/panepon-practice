import Link from "next/link";

export default function Home() {

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-8">モモポン</h1>
      <div className="flex gap-8">
      <Link href={"/game"}>ゲームを開始する</Link>
      </div>
    </div>
  );
}