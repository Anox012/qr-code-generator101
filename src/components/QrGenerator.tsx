"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { saveAs } from "file-saver";
import {
  buildVCardPayload,
  buildWifiPayload,
  type QrTab,
  type VCardData,
  type WifiData,
} from "@/lib/qrPayload";
import {
  renderQrToCanvas,
  renderQrToSvgString,
  type ErrorCorrectionLevel,
  type QrRenderOptions,
} from "@/lib/qrRender";

const TABS: { id: QrTab; label: string }[] = [
  { id: "url", label: "URL" },
  { id: "text", label: "Text" },
  { id: "wifi", label: "WiFi" },
  { id: "vcard", label: "vCard" },
];

const COLOR_PRESETS = [
  { name: "Sunset", fg: "#B91C1C", bg: "#FFFBEB", frame: "#EA580C" },
  { name: "Fire", fg: "#7C2D12", bg: "#FFF7ED", frame: "#DC2626" },
  { name: "Amber", fg: "#9A3412", bg: "#FFFFFF", frame: "#F59E0B" },
  { name: "Classic", fg: "#111827", bg: "#FFFFFF", frame: "#DC2626" },
  { name: "Bold", fg: "#FFFFFF", bg: "#DC2626", frame: "#7C2D12" },
];

export default function QrGenerator() {
  const [tab, setTab] = useState<QrTab>("url");

  const [urlValue, setUrlValue] = useState("https://example.com");
  const [textValue, setTextValue] = useState("สวัสดี! สแกน QR นี้ได้เลย");
  const [wifi, setWifi] = useState<WifiData>({
    ssid: "",
    password: "",
    encryption: "WPA",
    hidden: false,
  });
  const [vcard, setVcard] = useState<VCardData>({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    organization: "",
    title: "",
    website: "",
  });

  const [fgColor, setFgColor] = useState("#B91C1C");
  const [bgColor, setBgColor] = useState("#FFFBEB");
  const [frameColor, setFrameColor] = useState("#EA580C");
  const [frameBgColor, setFrameBgColor] = useState("#FFFFFF");
  const [frameTopText, setFrameTopText] = useState("SCAN ME");
  const [frameBottomText, setFrameBottomText] = useState("");
  const [errorCorrectionLevel, setErrorCorrectionLevel] = useState<ErrorCorrectionLevel>("M");
  const [cornerRadius, setCornerRadius] = useState(24);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const payload = useMemo(() => {
    switch (tab) {
      case "url":
        return urlValue.trim();
      case "text":
        return textValue;
      case "wifi":
        return wifi.ssid.trim() ? buildWifiPayload(wifi) : "";
      case "vcard":
        return vcard.firstName || vcard.lastName || vcard.phone || vcard.email
          ? buildVCardPayload(vcard)
          : "";
      default:
        return "";
    }
  }, [tab, urlValue, textValue, wifi, vcard]);

  const renderOptions: QrRenderOptions = useMemo(
    () => ({
      payload: payload || " ",
      fgColor,
      bgColor,
      errorCorrectionLevel,
      qrSize: 560,
      frameTopText,
      frameBottomText,
      frameColor,
      frameBgColor,
      cornerRadius,
    }),
    [payload, fgColor, bgColor, errorCorrectionLevel, frameTopText, frameBottomText, frameColor, frameBgColor, cornerRadius]
  );

  useEffect(() => {
    if (canvasRef.current) {
      renderQrToCanvas(canvasRef.current, renderOptions);
    }
  }, [renderOptions]);

  const isEmpty = !payload.trim();

  function handleExportPng() {
    if (!canvasRef.current) return;
    canvasRef.current.toBlob((blob) => {
      if (blob) saveAs(blob, "qr-code.png");
    }, "image/png");
  }

  function handleExportSvg() {
    const svg = renderQrToSvgString(renderOptions);
    const blob = new Blob([svg], { type: "image/svg+xml" });
    saveAs(blob, "qr-code.svg");
  }

  function applyPreset(preset: (typeof COLOR_PRESETS)[number]) {
    setFgColor(preset.fg);
    setBgColor(preset.bg);
    setFrameColor(preset.frame);
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-8 px-4 py-8 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
      <section className="order-2 rounded-3xl bg-white/80 p-5 shadow-xl shadow-orange-900/5 backdrop-blur sm:p-8 lg:order-1">
        <div className="mb-6 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                tab === t.id
                  ? "bg-gradient-to-r from-red-600 via-orange-500 to-yellow-400 text-white shadow-md shadow-orange-500/30"
                  : "bg-orange-50 text-orange-900 hover:bg-orange-100"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "url" && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700">ลิงก์ URL</label>
            <input
              type="text"
              value={urlValue}
              onChange={(e) => setUrlValue(e.target.value)}
              placeholder="https://example.com"
              className="w-full rounded-xl border border-orange-200 px-4 py-3 text-neutral-800 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
            />
          </div>
        )}

        {tab === "text" && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700">ข้อความ</label>
            <textarea
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-orange-200 px-4 py-3 text-neutral-800 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
            />
          </div>
        )}

        {tab === "wifi" && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="ชื่อ WiFi (SSID)">
              <input
                type="text"
                value={wifi.ssid}
                onChange={(e) => setWifi({ ...wifi, ssid: e.target.value })}
                className="input"
              />
            </Field>
            <Field label="รหัสผ่าน">
              <input
                type="text"
                value={wifi.password}
                onChange={(e) => setWifi({ ...wifi, password: e.target.value })}
                disabled={wifi.encryption === "nopass"}
                className="input disabled:opacity-40"
              />
            </Field>
            <Field label="การเข้ารหัส">
              <select
                value={wifi.encryption}
                onChange={(e) => setWifi({ ...wifi, encryption: e.target.value as WifiData["encryption"] })}
                className="input"
              >
                <option value="WPA">WPA/WPA2</option>
                <option value="WEP">WEP</option>
                <option value="nopass">ไม่มีรหัสผ่าน</option>
              </select>
            </Field>
            <label className="mt-6 flex items-center gap-2 text-sm text-neutral-700">
              <input
                type="checkbox"
                checked={wifi.hidden}
                onChange={(e) => setWifi({ ...wifi, hidden: e.target.checked })}
                className="h-4 w-4 accent-orange-600"
              />
              เครือข่ายซ่อนอยู่
            </label>
          </div>
        )}

        {tab === "vcard" && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="ชื่อ">
              <input
                type="text"
                value={vcard.firstName}
                onChange={(e) => setVcard({ ...vcard, firstName: e.target.value })}
                className="input"
              />
            </Field>
            <Field label="นามสกุล">
              <input
                type="text"
                value={vcard.lastName}
                onChange={(e) => setVcard({ ...vcard, lastName: e.target.value })}
                className="input"
              />
            </Field>
            <Field label="เบอร์โทร">
              <input
                type="text"
                value={vcard.phone}
                onChange={(e) => setVcard({ ...vcard, phone: e.target.value })}
                className="input"
              />
            </Field>
            <Field label="อีเมล">
              <input
                type="email"
                value={vcard.email}
                onChange={(e) => setVcard({ ...vcard, email: e.target.value })}
                className="input"
              />
            </Field>
            <Field label="บริษัท">
              <input
                type="text"
                value={vcard.organization}
                onChange={(e) => setVcard({ ...vcard, organization: e.target.value })}
                className="input"
              />
            </Field>
            <Field label="ตำแหน่ง">
              <input
                type="text"
                value={vcard.title}
                onChange={(e) => setVcard({ ...vcard, title: e.target.value })}
                className="input"
              />
            </Field>
            <Field label="เว็บไซต์" full>
              <input
                type="text"
                value={vcard.website}
                onChange={(e) => setVcard({ ...vcard, website: e.target.value })}
                className="input"
              />
            </Field>
          </div>
        )}

        <hr className="my-6 border-orange-100" />

        <div className="space-y-5">
          <div>
            <p className="mb-2 text-sm font-medium text-neutral-700">ธีมสี</p>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset)}
                  title={preset.name}
                  className="h-9 w-9 rounded-full border-2 border-white shadow ring-1 ring-black/10 transition hover:scale-110"
                  style={{
                    background: `linear-gradient(135deg, ${preset.fg}, ${preset.frame})`,
                  }}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <ColorField label="Foreground" value={fgColor} onChange={setFgColor} />
            <ColorField label="Background" value={bgColor} onChange={setBgColor} />
            <ColorField label="กรอบ/ตัวอักษร" value={frameColor} onChange={setFrameColor} />
            <ColorField label="พื้นหลังกรอบ" value={frameBgColor} onChange={setFrameBgColor} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="ข้อความบนกรอบ (บน)">
              <input
                type="text"
                value={frameTopText}
                onChange={(e) => setFrameTopText(e.target.value)}
                placeholder="เช่น SCAN ME"
                className="input"
              />
            </Field>
            <Field label="ข้อความบนกรอบ (ล่าง)">
              <input
                type="text"
                value={frameBottomText}
                onChange={(e) => setFrameBottomText(e.target.value)}
                placeholder="เช่น ชื่อร้านของคุณ"
                className="input"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="ความคมชัด (Error correction)">
              <select
                value={errorCorrectionLevel}
                onChange={(e) => setErrorCorrectionLevel(e.target.value as ErrorCorrectionLevel)}
                className="input"
              >
                <option value="L">L - ต่ำ</option>
                <option value="M">M - ปานกลาง</option>
                <option value="Q">Q - สูง</option>
                <option value="H">H - สูงสุด</option>
              </select>
            </Field>
            <Field label={`มุมโค้งกรอบ (${cornerRadius}px)`}>
              <input
                type="range"
                min={0}
                max={64}
                value={cornerRadius}
                onChange={(e) => setCornerRadius(Number(e.target.value))}
                className="mt-3 w-full accent-orange-600"
              />
            </Field>
          </div>
        </div>
      </section>

      <section className="order-1 flex flex-col items-center gap-4 lg:sticky lg:top-8 lg:order-2 lg:self-start">
        <div className="w-full rounded-3xl bg-gradient-to-br from-red-600 via-orange-500 to-yellow-400 p-1 shadow-2xl shadow-orange-900/20">
          <div className="flex items-center justify-center rounded-[22px] bg-white p-4 sm:p-6">
            <canvas ref={canvasRef} className="h-auto w-full max-w-sm" />
          </div>
        </div>

        {isEmpty && (
          <p className="text-center text-sm text-orange-900/60">
            กรอกข้อมูลด้านซ้ายเพื่อสร้าง QR Code
          </p>
        )}

        <div className="flex w-full gap-3">
          <button
            onClick={handleExportPng}
            disabled={isEmpty}
            className="flex-1 rounded-xl bg-gradient-to-r from-red-600 to-orange-500 px-4 py-3 font-semibold text-white shadow-lg shadow-orange-500/30 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ดาวน์โหลด PNG
          </button>
          <button
            onClick={handleExportSvg}
            disabled={isEmpty}
            className="flex-1 rounded-xl border-2 border-orange-500 px-4 py-3 font-semibold text-orange-700 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ดาวน์โหลด SVG
          </button>
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={`space-y-2 ${full ? "sm:col-span-2" : ""}`}>
      <label className="text-sm font-medium text-neutral-700">{label}</label>
      {children}
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-neutral-600">{label}</label>
      <div className="flex items-center gap-2 rounded-xl border border-orange-200 px-2 py-1.5">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 w-7 cursor-pointer rounded border-none bg-transparent p-0"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-sm text-neutral-700 outline-none"
        />
      </div>
    </div>
  );
}
