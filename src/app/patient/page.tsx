"use client";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import JsBarcode from "jsbarcode";
import { jsPDF } from "jspdf";

export default function PatientPage() {
    const [time, setTime] = useState("");
    const [language, setLanguage] = useState<"en" | "ar">("en");
    const [iqama, setIqama] = useState("");
    const [prescription, setPrescription] = useState("");
    const [nextQueue, setNextQueue] = useState("Loading...");
    const [isClient, setIsClient] = useState(false);
    const [pharmacyId, setPharmacyId] = useState<string | null>(null);
    // Off-DOM SVG refs (we create SVG elements with createElementNS and never append them)
    const iqamaSvgRef = useRef<SVGElement | null>(null);
    const prescriptionSvgRef = useRef<SVGElement | null>(null);


    useEffect(() => {
        setIsClient(true);
    }, []);

    const pharmacyName = isClient ? localStorage.getItem("pharmacyName") : null;




    useEffect(() => {
        setIsClient(true);
        const id = localStorage.getItem("pharmacyId");
        setPharmacyId(id);
    }, []);
    const translations = {
        en: {
            title: "Barcode Printer",
            nextQueueLabel: "Next Queue Number:",
            iqamaLabel: "ID Number#:",
            prescriptionLabel: "Prescription #:",
            iqamaPlaceholder: "Enter ID Number",
            prescriptionPlaceholder: "Enter Prescription #",
            printBtn: "Print",
            pdfBtn: "PDF (57mm x 80mm)",
            clearBtn: "Clear",
            iqamaPrintLabel: "ID Number",
            prescriptionPrintLabel: "Prescription #",
            build: "Build",
            loading: "Loading..."
        },
        ar: {
            title: "طابعة الباركود",
            nextQueueLabel: "رقم الدور التالي:",
            iqamaLabel: "رقم الهوية:",
            prescriptionLabel: "رقم الوصفة:",
            iqamaPlaceholder: "ادخل رقم الهوية",
            prescriptionPlaceholder: "ادخل رقم الوصفة",
            printBtn: "طباعة الباركود",
            pdfBtn: "طباعة الباركود (57مم × 80مم)",
            clearBtn: "مسح",
            iqamaPrintLabel: "رقم الهوية",
            prescriptionPrintLabel: "رقم الوصفة",
            build: "البناء",
            loading: "جارٍ التحميل..."
        }
    };


    useEffect(() => {
        function updateTime() {
            const now = new Date();
            const hours = now.getHours().toString().padStart(2, "0");
            const minutes = now.getMinutes().toString().padStart(2, "0");
            setTime(`${hours}:${minutes}`);
        }

        updateTime(); // initial call

        const interval = setInterval(updateTime, 1000); // check every second for minute change

        return () => clearInterval(interval);
    }, []);

    const today = new Date().toLocaleDateString();

    const t = translations[language];
    // helper: generate semi-unique device id
    function generateDeviceId() {
        if (!isClient) return "server";
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

    // Fix hydration issues by ensuring client-side code runs after mount
    useEffect(() => {
        setIsClient(true);
    }, []);

    async function saveToDB(iqamaId: string, prescriptionNumber: string) {
        const pharmacyId = parseInt(localStorage.getItem("pharmacyId") || "0", 10); // ✅ convert to Int

        const res = await fetch("/api/counter/increment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                iqamaId,
                prescriptionNumber,
                deviceId: generateDeviceId(),
                phar_id: pharmacyId, // ✅ Int now
            }),
        });

        if (!res.ok) throw new Error("Failed to save");
        return res.json();
    }

    // Helper: create an off-DOM SVG and render barcode into it
    function createBarcodeSvg(value: string | number) {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg") as SVGSVGElement;
        JsBarcode(svg, String(value), {
            format: "CODE128",
            width: 2,
            height: 40,
            displayValue: true,
            fontSize: 10,
            margin: 5,
        });
        return svg;
    }

    // inside PatientPage
    useEffect(() => {
        async function fetchLastCounter() {
            try {
                const pharmacyId = localStorage.getItem("pharmacyId");
                if (!pharmacyId) return;

                const res = await fetch(`/api/counter/last?pharmacyId=${pharmacyId}`, { cache: "no-store" });
                const data = await res.json();

                if (data && typeof data.counter === "number") {
                    setNextQueue(String(data.counter + 1));
                } else {
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

            if (!validateInputs()) return;

            // Create Queue SVG
            const queueSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg") as SVGSVGElement;
            JsBarcode(queueSvg, String(counterRow.counter), {
                format: "CODE128",
                width: 2,
                height: 50,
                displayValue: true,
                fontSize: 14,
                margin: 5,
                fontOptions: "bold",
            });

            // Full HTML for print page (✅ unchanged)
            const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${t.title}</title>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; margin: 0; padding: 10px; }
            .barcode-container { margin: 15px 0; page-break-inside: avoid; }
            h3 { margin: 15px 0 5px; font-size: 16px; font-weight: bold; }
            .queue-number { font-size: 24px; font-weight: bold; margin: 10px 0; }
            @media print {
              @page { size: 57mm 80mm; margin: 0; }
              body { width: 57mm; height: 80mm; margin: 0 auto; padding: 5mm; }
            }
          </style>
        </head>
        <body>
          <div class="barcode-container">
            <h3>${language === 'en' ? 'Queue Number' : 'رقم الدور'}</h3>
            <div class="queue-number">${counterRow.counter}</div>
            ${queueSvg.outerHTML}
          </div>
          <div class="barcode-container">
            <h3>${t.iqamaPrintLabel}</h3>
            ${iqamaSvgRef.current?.outerHTML || ""}
          </div>
          <div class="barcode-container">
            <h3>${t.prescriptionPrintLabel}</h3>
            ${prescriptionSvgRef.current?.outerHTML || ""}
          </div>
          <script>
            window.onload = function() {
              setTimeout(() => window.print(), 300);
            }
          </script>
        </body>
      </html>
    `;

            // ✅ Detect mobile
            const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

            if (isMobile) {
                // 👉 Android/iOS cannot use window.open + print reliably
                const blob = new Blob([htmlContent], { type: "text/html" });
                const url = URL.createObjectURL(blob);
                window.location.href = url; // opens in default viewer → user can print
            } else {
                // 👉 Desktop normal flow
                const printWindow = window.open("", "_blank");
                if (!printWindow) {
                    alert(
                        language === "en"
                            ? "Pop-up blocker may be preventing the print window."
                            : "قد يمنع مانع النوافذ المنبثقة فتح نافذة الطباعة."
                    );
                    return;
                }
                printWindow.document.open();
                printWindow.document.write(htmlContent);
                printWindow.document.close();
            }
        } catch (e) {
            alert("Error saving to database");
            console.error(e);
        }
    };



    /* 
    
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
                    // Create a new SVG for the queue number barcode with larger font
                    const queueSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg") as SVGSVGElement;
                    JsBarcode(queueSvg, String(nextQueue), {
                        format: "CODE128",
                        width: 2,
                        height: 50,  // Slightly taller for better visibility
                        displayValue: true,
                        fontSize: 14,  // Increased from 10 to 14
                        margin: 5,
                        fontOptions: 'bold',
                    });
    
                    // Create a temporary div to safely set innerHTML
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>${t.title}</title>
              <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
              <style>
                body { 
                  font-family: Arial, sans-serif; 
                  text-align: center; 
                  margin: 0;
                  padding: 10px;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                .barcode-container { 
                  margin: 15px 0;
                  page-break-inside: avoid;
                }
                h3 { 
                  margin: 15px 0 5px; 
                  font-size: 16px;
                  font-weight: bold;
                }
                .queue-number {
                  font-size: 24px;
                  font-weight: bold;
                  margin: 10px 0;
                }
                @media print {
                  @page {
                    size: 57mm 80mm;
                    margin: 0;
                  }
                  body {
                    width: 57mm;
                    height: 80mm;
                    margin: 0 auto;
                    padding: 5mm;
                  }
                }
              </style>
            </head>
            <body>
              <div class="barcode-container">
                <h3>${language === 'en' ? 'Queue Number' : 'رقم الدور'}</h3>
                <div class="queue-number">${nextQueue}</div>
                ${queueSvg.outerHTML}
              </div>
              <div class="barcode-container">
                <h3>${t.iqamaPrintLabel}</h3>
                ${iqamaSvgRef.current?.outerHTML || ""}
              </div>
              <div class="barcode-container">
                <h3>${t.prescriptionPrintLabel}</h3>
                ${prescriptionSvgRef.current?.outerHTML || ""}
              </div>
            </body>
          </html>`;
    
                    // Write the content to the print window
                    printWindow.document.open('text/html', 'replace');
                    printWindow.document.write(tempDiv.innerHTML);
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
        }; */
    /*     // Modify handlePrint
        const handlePrint = () => {
            
        };
     */
    const handlePdf = async () => {
        if (!validateInputs()) return;

        try {
            const counterRow = await saveToDB(iqama, prescription);
            const currentQueue = String(counterRow.counter);
            setNextQueue(String(counterRow.counter + 1));
            console.log("✅ Saved (PDF):", counterRow);

            const doc = new jsPDF({ unit: "mm", format: [57, 80] });

            // QUEUE NUMBER SECTION 
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text(language === 'en' ? 'Queue Number' : 'رقم الدور', 28.5, 8, { align: 'center' });

            doc.setFontSize(20);
            doc.setFont('helvetica', 'bold');
            doc.text(currentQueue, 28.5, 16, { align: 'center' });

            // Queue Number Barcode - smaller
            const queueSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg") as SVGSVGElement;
            JsBarcode(queueSvg, currentQueue, {
                format: "CODE128",
                width: 1.5,
                height: 20,
                displayValue: true,
                fontSize: 8,
                margin: 3,
            });

            const queueSvgString = new XMLSerializer().serializeToString(queueSvg);
            const queueCanvas = document.createElement("canvas");
            const queueCtx = queueCanvas.getContext("2d");
            const queueImg = new window.Image();
            const queueSvgBlob = new Blob([queueSvgString], { type: "image/svg+xml;charset=utf-8" });
            const queueUrl = URL.createObjectURL(queueSvgBlob);

            await new Promise<void>((resolve) => {
                queueImg.onload = () => {
                    queueCanvas.width = queueImg.width;
                    queueCanvas.height = queueImg.height;
                    queueCtx?.drawImage(queueImg, 0, 0);
                    const pngDataUrl = queueCanvas.toDataURL("image/png");
                    doc.addImage(pngDataUrl, "PNG", 10, 20, 37, 8);
                    URL.revokeObjectURL(queueUrl);
                    resolve();
                };
                queueImg.src = queueUrl;
            });

            // IQAMA ID SECTION - smaller text
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(`${t.iqamaPrintLabel}`, 28.5, 35, { align: 'center' });

            if (iqamaSvgRef.current) {
                const iqamaSvgString = new XMLSerializer().serializeToString(iqamaSvgRef.current);
                const iqamaCanvas = document.createElement("canvas");
                const iqamaCtx = iqamaCanvas.getContext("2d");
                const iqamaImg = new window.Image();
                const iqamaSvgBlob = new Blob([iqamaSvgString], { type: "image/svg+xml;charset=utf-8" });
                const iqamaUrl = URL.createObjectURL(iqamaSvgBlob);

                await new Promise<void>((resolve) => {
                    iqamaImg.onload = () => {
                        iqamaCanvas.width = iqamaImg.width;
                        iqamaCanvas.height = iqamaImg.height;
                        iqamaCtx?.drawImage(iqamaImg, 0, 0);
                        const pngDataUrl = iqamaCanvas.toDataURL("image/png");
                        doc.addImage(pngDataUrl, "PNG", 10, 38, 37, 8);
                        URL.revokeObjectURL(iqamaUrl);
                        resolve();
                    };
                    iqamaImg.src = iqamaUrl;
                });
            }

            // PRESCRIPTION SECTION - smaller text
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(`${t.prescriptionPrintLabel}`, 28.5, 52, { align: 'center' });

            if (prescriptionSvgRef.current) {
                const prescriptionSvgString = new XMLSerializer().serializeToString(prescriptionSvgRef.current);
                const prescriptionCanvas = document.createElement("canvas");
                const prescriptionCtx = prescriptionCanvas.getContext("2d");
                const prescriptionImg = new window.Image();
                const prescriptionSvgBlob = new Blob([prescriptionSvgString], { type: "image/svg+xml;charset=utf-8" });
                const prescriptionUrl = URL.createObjectURL(prescriptionSvgBlob);

                await new Promise<void>((resolve) => {
                    prescriptionImg.onload = () => {
                        prescriptionCanvas.width = prescriptionImg.width;
                        prescriptionCanvas.height = prescriptionImg.height;
                        prescriptionCtx?.drawImage(prescriptionImg, 0, 0);
                        const pngDataUrl = prescriptionCanvas.toDataURL("image/png");
                        doc.addImage(pngDataUrl, "PNG", 10, 55, 37, 8);
                        URL.revokeObjectURL(prescriptionUrl);
                        resolve();
                    };
                    prescriptionImg.src = prescriptionUrl;
                });
            }

            // Save the PDF
            doc.save(`queue-${currentQueue}.pdf`);

        } catch (e) {
            console.error("Error generating PDF:", e);
            alert(language === "en"
                ? "Error generating PDF. Please try again."
                : "خطأ في إنشاء ملف PDF. يرجى المحاولة مرة أخرى.");
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
            {/* Top-center pharmacy name */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-gray-800 !text-white rounded-lg font-semibold shadow-lg">
                {pharmacyName || "No pharmacy selected"}
            </div>

            {/* Back Button */}
            <button
                onClick={() => (window.location.href = "/landing")}
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
                        className="flex-1 px-3 py-1.5 rounded-md bg-blue-600 !text-white text-sm hover:bg-blue-700 hover:!text-white transition"
                    >
                        {t.printBtn}
                    </button>

                    <button
                        onClick={handlePdf}
                        className="flex-1 px-3 py-1.5 rounded-md bg-green-600 !text-white text-sm hover:bg-green-700 hover:!text-white transition"
                    >
                        {t.pdfBtn}
                    </button>

                    <button
                        onClick={handleClear}
                        className="flex-1 px-3 py-1.5 rounded-md bg-gray-500 !text-white text-sm hover:bg-gray-600 hover:!text-white transition"
                    >
                        {t.clearBtn}
                    </button>


                </div>



            </div>
            <div className="fixed bottom-4 right-4 bg-gray-800 !text-white px-3 py-1 rounded shadow-lg font-mono text-sm">
                {today} {time}
            </div>
        </div>
    );
}
