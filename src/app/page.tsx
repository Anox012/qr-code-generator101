import QrGenerator from "@/components/QrGenerator";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 via-orange-50 to-yellow-50">
      <header className="mx-auto max-w-6xl px-4 pt-10 text-center sm:px-8">
        <h1 className="bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500 bg-clip-text text-3xl font-extrabold text-transparent sm:text-4xl">
          QR Code Generator
        </h1>
        <p className="mt-2 text-sm text-orange-900/70 sm:text-base">
          สร้าง QR Code จาก URL, ข้อความ, WiFi หรือ vCard พร้อมปรับสีและกรอบได้ตามใจ
        </p>
      </header>
      <QrGenerator />
      <footer className="pb-8 text-center text-xs text-orange-900/50">
        รองรับการดาวน์โหลดเป็น PNG และ SVG
      </footer>
    </div>
  );
}
