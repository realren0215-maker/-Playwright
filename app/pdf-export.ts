const PDF_PAGE_WIDTH_PX = 1122;
const PDF_PAGE_HEIGHT_PX = 794;

function waitForImages(root: HTMLElement) {
  const images = Array.from(root.querySelectorAll("img"));
  return Promise.all(images.map(image => {
    if (image.complete && image.naturalWidth > 0) return Promise.resolve();
    return new Promise<void>(resolve => {
      image.addEventListener("load", () => resolve(), { once: true });
      image.addEventListener("error", () => resolve(), { once: true });
    });
  }));
}

export function isMobilePdfBrowser() {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
    || navigator.maxTouchPoints > 1
    || window.matchMedia("(max-width: 980px)").matches;
}

export function safePdfFilename(storeName: string, reportDate: string) {
  const safeStore = (storeName || "매장").replace(/[\\/:*?"<>|]/g, "_").trim();
  const safeDate = (reportDate || new Date().toISOString().slice(0, 10)).replace(/[^0-9.-]/g, "");
  return `고덕지도_입점완료보고서_${safeStore}_${safeDate}.pdf`;
}

export async function createReportPdf(pages: HTMLElement[]) {
  if (!pages.length) throw new Error("PDF로 만들 보고서 페이지가 없습니다.");
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4", compress: true });

  for (let index = 0; index < pages.length; index += 1) {
    const clone = pages[index].cloneNode(true) as HTMLElement;
    clone.classList.add("pdf-export-page");
    Object.assign(clone.style, {
      width: `${PDF_PAGE_WIDTH_PX}px`, height: `${PDF_PAGE_HEIGHT_PX}px`, position: "fixed",
      left: "-12000px", top: "0", margin: "0", borderRadius: "0", boxShadow: "none",
    });
    document.body.appendChild(clone);
    try {
      await waitForImages(clone);
      await document.fonts?.ready;
      const canvas = await html2canvas(clone, {
        backgroundColor: "#ffffff", scale: 1.5, useCORS: true, allowTaint: false, logging: false,
        width: PDF_PAGE_WIDTH_PX, height: PDF_PAGE_HEIGHT_PX, windowWidth: 1440, windowHeight: 1000,
        scrollX: 0, scrollY: 0,
      });
      if (index > 0) pdf.addPage("a4", "landscape");
      pdf.addImage(canvas.toDataURL("image/jpeg", 0.94), "JPEG", 0, 0, 297, 210, undefined, "FAST");
      canvas.width = 1;
      canvas.height = 1;
    } finally {
      clone.remove();
    }
  }
  return pdf.output("blob");
}

export async function downloadOrOpenPdf(blob: Blob, filename: string, reservedWindow: Window | null) {
  const url = URL.createObjectURL(blob);
  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const pdfFile = new File([blob], filename, { type: "application/pdf" });
  const shareNavigator = navigator as Navigator & { canShare?: (data: ShareData) => boolean };

  if (isMobilePdfBrowser() && navigator.share && shareNavigator.canShare?.({ files: [pdfFile] })) {
    try {
      await navigator.share({ files: [pdfFile], title: filename });
      if (reservedWindow && !reservedWindow.closed) reservedWindow.close();
      window.setTimeout(() => URL.revokeObjectURL(url), 120_000);
      return;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        if (reservedWindow && !reservedWindow.closed) reservedWindow.close();
        window.setTimeout(() => URL.revokeObjectURL(url), 120_000);
        return;
      }
    }
  }

  if (reservedWindow && !reservedWindow.closed) {
    const doc = reservedWindow.document;
    doc.title = "PDF 저장";
    doc.body.innerHTML = '<main style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:40px 24px;color:#182338"><h1 style="font-size:22px">PDF가 생성되었습니다</h1><p style="line-height:1.6;color:#667287">아래 버튼을 눌러 PDF 파일을 저장하세요.</p></main>';
    const main = doc.querySelector("main")!;
    const download = doc.createElement("a");
    download.href = url;
    download.download = filename;
    download.textContent = "PDF 파일 다운로드";
    download.style.cssText = "display:block;margin-top:24px;padding:14px 18px;border-radius:10px;background:#1677ff;color:white;text-decoration:none;text-align:center;font-weight:700";
    const open = doc.createElement("a");
    open.href = url;
    open.textContent = "다운로드가 안 되면 PDF 열기";
    open.style.cssText = "display:block;margin-top:12px;padding:12px 18px;color:#1677ff;text-align:center";
    main.append(download, open);
  } else if (isIos) {
    window.location.href = url;
  } else {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }
  window.setTimeout(() => URL.revokeObjectURL(url), 120_000);
}

export function showPdfError(reservedWindow: Window | null, message: string) {
  if (!reservedWindow || reservedWindow.closed) return;
  reservedWindow.document.body.innerHTML = `<main style="font-family:Arial,sans-serif;padding:32px;line-height:1.6"><h1 style="font-size:20px">PDF 생성 실패</h1><p>${message.replace(/[<>&]/g, "")}</p><button onclick="window.close()" style="padding:10px 16px">닫기</button></main>`;
}
