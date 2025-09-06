"use client";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import JsBarcode from "jsbarcode";
import { jsPDF } from "jspdf";

export default function PatientPage() {
    const [language, setLanguage] = useState<"en" | "ar">("en");
    const [iqama, setIqama] = useState("");
    const [prescription, setPrescription] = useState("");
    const [nextQueue, setNextQueue] = useState("Loading...");

    // Off-DOM SVG refs (we create SVG elements with createElementNS and never append them)
    const iqamaSvgRef = useRef<SVGElement | null>(null);
    const prescriptionSvgRef = useRef<SVGElement | null>(null);

    const translations = {
        en: {
            title: "Barcode Printer",
            nextQueueLabel: "Next Queue Number:",
            iqamaLabel: "Iqama ID#:",
            prescriptionLabel: "Prescription #:",
            iqamaPlaceholder: "Enter Iqama ID",
            prescriptionPlaceholder: "Enter Prescription #",
            printBtn: "Print",
            pdfBtn: "PDF (57mm x 80mm)",
            clearBtn: "Clear",
            iqamaPrintLabel: "Iqama ID",
            prescriptionPrintLabel: "Prescription #",
            build: "Build",
            loading: "Loading..."
        },
        ar: {
            title: "طابعة الباركود",
            nextQueueLabel: "رقم الدور التالي:",
            iqamaLabel: "رقم الإقامة:",
            prescriptionLabel: "رقم الوصفة:",
            iqamaPlaceholder: "ادخل رقم الإقامة",
            prescriptionPlaceholder: "ادخل رقم الوصفة",
            printBtn: "طباعة الباركود",
            pdfBtn: "طباعة الباركود (57مم × 80مم)",
            clearBtn: "مسح",
            iqamaPrintLabel: "رقم الإقامة",
            prescriptionPrintLabel: "رقم الوصفة",
            build: "البناء",
            loading: "جارٍ التحميل..."
        }
    };

    const t = translations[language];
    // helper: generate semi-unique device id
    function generateDeviceId() {
        if (typeof window === "undefined") return "server";
        const key = "deviceId";
        let stored = localStorage.getItem(key);
        if (stored) return stored;
        const fingerprint = navigator.userAgent + screen.width + screen.height;
        let hash = 0;
        for (let i = 0; i < fingerprint.length; i++) {
            hash = (hash << 5) - hash + fingerprint.charCodeAt(i);
            hash |= 0;
        }
        stored = "device_" + Math.abs(hash).toString(16);
        localStorage.setItem(key, stored);
        return stored;
    }

    async function saveToDB(iqamaId: string, prescriptionNumber: string) {
        const res = await fetch("/api/counter/increment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                iqamaId,
                prescriptionNumber,
                deviceId: generateDeviceId(),
            }),
        });
        if (!res.ok) throw new Error("Failed to save");
        return res.json();
    }
    // Helper: create an off-DOM SVG and render barcode into it
    function createBarcodeSvg(value: string | number) {
        // create proper SVG element namespace (important)
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        // JsBarcode expects a DOM element; cast as any to avoid TS complaints
        JsBarcode(svg as any, String(value), {
            format: "CODE128",
            width: 2,
            height: 40,
            displayValue: true,
            fontSize: 10,
            margin: 5
        });
        return svg;
    }
    // inside PatientPage
    useEffect(() => {
        async function fetchLastCounter() {
            try {
                const res = await fetch("/api/counter/last", { cache: "no-store" });
                const data = await res.json();

                if (data && data.counter) {
                    setNextQueue(String(data.counter + 1));
                } else {
                    // no entry today yet
                    setNextQueue("1");
                }
            } catch (err) {
                console.error("❌ Failed to fetch last counter:", err);
                setNextQueue("Error");
            }
        }

        fetchLastCounter();
    }, []);

    // Generate Barcodes off-DOM whenever input changes
    useEffect(() => {
        if (iqama) {
            iqamaSvgRef.current = createBarcodeSvg(iqama);
        } else {
            iqamaSvgRef.current = null;
        }

        if (prescription) {
            prescriptionSvgRef.current = createBarcodeSvg(prescription);
        } else {
            prescriptionSvgRef.current = null;
        }

        // No DOM cleanup needed because we never append these nodes to DOM
    }, [iqama, prescription]);

    /* // Fake fetch queue number (replace with API)
    useEffect(() => {
        const timer = setTimeout(() => {
            setNextQueue(language === "en" ? "12345" : "١٢٣٤٥");
        }, 1000);

        return () => clearTimeout(timer);
    }, [language]);
 */
    // ✅ Validation helper
    const validateInputs = () => {
        if (!iqama || !prescription) {
            alert(language === "en" ? "Both fields are required." : "كلا الحقلين مطلوبان.");
            return false;
        }
        if (!/^\d+$/.test(iqama) || !/^\d+$/.test(prescription)) {
            alert(language === "en" ? "Please enter numbers only." : "يرجى إدخال أرقام فقط.");
            return false;
        }
        return true;
    };







    const handlePrint = async () => {
        if (!/^\d+$/.test(iqama) || !/^\d+$/.test(prescription)) {
            alert("⚠ Please enter numeric values for both fields.");
            return;
        }

        try {
            const counterRow = await saveToDB(iqama, prescription);
            setNextQueue(String(counterRow.counter + 1));
            console.log("✅ Saved:", counterRow);

            if (!validateInputs()) return; // ⬅ block if invalid

            const printWindow = window.open("", "printWindow", "width=400,height=600");
            if (printWindow) {
                printWindow.document.write(`
      <html>
        <head><title>${t.title}</title></head>
        <body>
          <div>
            <h3>${t.iqamaPrintLabel}</h3>
            ${iqamaSvgRef.current?.outerHTML || ""}
            <h3>${t.prescriptionPrintLabel}</h3>
            ${prescriptionSvgRef.current?.outerHTML || ""}
          </div>
        </body>
      </html>
    `);
                printWindow.document.close();
                printWindow.focus();
                setTimeout(() => {
                    printWindow.print();
                    printWindow.close();
                }, 2000);
            } else {
                alert(language === "en"
                    ? "Pop-up blocker may be preventing the print window."
                    : "قد يمنع مانع النوافذ المنبثقة فتح نافذة الطباعة.");
            }
            // use counterRow.counter if you want to show queue number
        } catch (e) {
            alert("Error saving to database");
            console.error(e);
        }
    };
    /*     // Modify handlePrint
        const handlePrint = () => {
            
        };
     */
    const handlePdf = async () => {
        if (!validateInputs()) return; // ⬅ block if invalid

        try {
            // ⬅ Save first (like handlePrint)
            const counterRow = await saveToDB(iqama, prescription);
            setNextQueue(String(counterRow.counter + 1));
            console.log("✅ Saved (PDF):", counterRow);

            // ⬅ Then continue with your existing PDF logic
            const doc = new jsPDF({
                unit: "mm",
                format: [57, 80]
            });

            doc.setFontSize(10);
            let y = 10;

            if (iqamaSvgRef.current) {
                const svgString = new XMLSerializer().serializeToString(iqamaSvgRef.current);
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                const img = new window.Image();

                const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
                const url = URL.createObjectURL(svgBlob);

                await new Promise<void>((resolve) => {
                    img.onload = () => {
                        canvas.width = img.width;
                        canvas.height = img.height;
                        ctx?.drawImage(img, 0, 0);
                        const pngDataUrl = canvas.toDataURL("image/png");
                        doc.text(`${t.iqamaPrintLabel}:`, 10, y);
                        doc.addImage(pngDataUrl, "PNG", 10, y + 2, 35, 12);
                        URL.revokeObjectURL(url);
                        resolve();
                    };
                    img.src = url;
                });

                y += 25;
            }

            if (prescriptionSvgRef.current) {
                const svgString = new XMLSerializer().serializeToString(prescriptionSvgRef.current);
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                const img = new window.Image();

                const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
                const url = URL.createObjectURL(svgBlob);

                await new Promise<void>((resolve) => {
                    img.onload = () => {
                        canvas.width = img.width;
                        canvas.height = img.height;
                        ctx?.drawImage(img, 0, 0);
                        const pngDataUrl = canvas.toDataURL("image/png");
                        doc.text(`${t.prescriptionPrintLabel}:`, 10, y);
                        doc.addImage(pngDataUrl, "PNG", 10, y + 2, 35, 12);
                        URL.revokeObjectURL(url);
                        resolve();
                    };
                    img.src = url;
                });
            }

            doc.save("barcode.pdf");
        } catch (e) {
            alert("Error saving to database");
            console.error("❌ PDF Save Error:", e);
        }
    };


    // Clear inputs
    const handleClear = () => {
        setIqama("");
        setPrescription("");
        setNextQueue(t.loading);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 relative">
            {/* Back Button */}
            <button
                onClick={() => (window.location.href = "/")}
                className="absolute top-4 left-4 px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 transition"
            >
                ⬅ Back
            </button>

            {/* Language Toggle */}
            <div className="absolute top-4 right-4">
                <div
                    onClick={() => setLanguage(language === "en" ? "ar" : "en")}
                    className="w-20 h-10 flex items-center bg-gray-300 rounded-full p-1 cursor-pointer transition"
                >
                    <div
                        className={`w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-md transform transition-transform duration-300 ${language === "ar" ? "translate-x-10" : "translate-x-0"}`}
                    >
                        {language === "en" ? "EN" : "ع"}
                    </div>
                </div>
            </div>

            {/* Card */}
            <div className="bg-white p-8 rounded-2xl shadow-lg w-96">
                <div className="flex justify-center mb-6">
                    <Image src="/logo.jpg" alt="Logo" width={120} height={120} />
                </div>
                <h1 className="text-xl font-bold text-center mb-4">{t.title}</h1>
                {/*     <p className="text-sm text-gray-600 text-center mb-4">
                    {t.build}: 2025-07-22 15:51
                </p> */}

                {/* Next Queue */}
                <div className="mb-4 text-center">
                    <span className="font-medium">{t.nextQueueLabel}</span>{" "}
                    <span className="text-blue-600 font-bold">{nextQueue}</span>
                </div>

                {/* Form */}
                <div className="mb-4">
                    <label className="block mb-1">{t.iqamaLabel}</label>
                    <input
                        type="text"
                        value={iqama}
                        onChange={(e) => setIqama(e.target.value)}
                        placeholder={t.iqamaPlaceholder}
                        className="w-full border px-3 py-2 rounded-lg"
                    />
                </div>
                <div className="mb-4">
                    <label className="block mb-1">{t.prescriptionLabel}</label>
                    <input
                        type="text"
                        value={prescription}
                        onChange={(e) => setPrescription(e.target.value)}
                        placeholder={t.prescriptionPlaceholder}
                        className="w-full border px-3 py-2 rounded-lg"
                    />
                </div>

                {/* Buttons */}
                <div className="flex justify-between mt-6 gap-3">
                    <button
                        onClick={handlePrint}
                        className="flex-1 px-3 py-1.5 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700 transition"
                    >
                        {t.printBtn}
                    </button>
                    <button
                        onClick={handlePdf}
                        className="flex-1 px-3 py-1.5 rounded-md bg-green-600 text-white text-sm hover:bg-green-700 transition"
                    >
                        {t.pdfBtn}
                    </button>
                    <button
                        onClick={handleClear}
                        className="flex-1 px-3 py-1.5 rounded-md bg-gray-500 text-white text-sm hover:bg-gray-600 transition"
                    >
                        {t.clearBtn}
                    </button>
                </div>



            </div>
        </div>
    );
}
