import { Sprout } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center space-y-8">
        <div className="flex justify-center">
          <Sprout className="w-24 h-24 text-green-600" />
        </div>

        <h1 className="font-serif text-5xl md:text-7xl font-bold tracking-tight">
          Sam Nghe Thay Cu
        </h1>

        <p className="text-xl text-muted-foreground max-w-2xl">
          Nền tảng thương mại điện tử định hướng nội dung
        </p>

        <div className="pt-8 space-y-2">
          <p className="text-sm text-muted-foreground">
            🚀 Infrastructure Ready
          </p>
          <p className="text-sm text-muted-foreground">
            ⚡ Powered by Medusa v2 & Next.js 15
          </p>
        </div>
      </div>
    </main>
  );
}
