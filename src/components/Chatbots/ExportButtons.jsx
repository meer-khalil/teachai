import React, { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import * as XLSX from "xlsx";

// import * as DOX from "htm"

import doc from "../../images/Icons/doc.png";
import docs from "../../images/Icons/docs.png";
import excel from "../../images/Icons/excel.png";
import pdf from "../../images/Icons/pdf.png";

const ExportButtons = ({ componentToPrint, answer }) => {
  const generateDocx = () => {
    let documentFileContent = "Title: Lisa The General Lesson Planner\n\n";
    for (let i = 0; i < answer.length; i++) {
      if (i == 0) {
        documentFileContent += answer[i]["answer"] + "\n\n";
        continue;
      }

      documentFileContent += "Question: " + answer[i]["question"] + "\n";
      documentFileContent += "Answer: " + answer[i]["answer"] + "\n\n";
    }

    documentFileContent = documentFileContent.replace(/<br\s*\/?>/g, "\n\n");

    var url =
      "data:application/vnd.ms-word;charset=utf-8," +
      encodeURIComponent(documentFileContent);
    const filename = "Lisa-The-General_Lesson-History.doc";
    var downloadLink = document.createElement("a");

    downloadLink.href = url;

    downloadLink.download = filename;
    downloadLink.click();
  };

  const handleToXLSX = () => {
    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const trH = document.createElement("tr");

    const thQ = document.createElement("th");
    thQ.innerText = "Questions";

    const thA = document.createElement("th");
    thA.innerText = "Answer";

    trH.append(thQ);
    trH.append(thA);

    thead.append(trH);

    table.append(thead);

    const tbody = document.createElement("tbody");

    for (let i = 0; i < answer.length; i++) {
      const tr = document.createElement("tr");
      if (i == 0) {
        tr.append(document.createElement("td"));
        const tdAns = document.createElement("td");
        tdAns.innerText = answer[i]["answer"];
        tr.append(tdAns);
        tbody.append(tr);
        continue;
      }

      const tdQuestion = document.createElement("td");
      tdQuestion.innerText = answer[i]["question"];

      const tdAnswer = document.createElement("td");
      tdAnswer.innerText = answer[i]["answer"];

      tr.append(tdQuestion);
      tr.append(tdAnswer);

      tbody.append(tr);
    }

    table.append(tbody);

    // Extract Data (create a workbook object from the table)
    var workbook = XLSX.utils.table_to_book(table);

    // Process Data (add a new row)
    var ws = workbook.Sheets["Sheet1"];
    XLSX.utils.sheet_add_aoa(ws, [["Created " + new Date().toISOString()]], {
      origin: -1,
    });

    // Package and Release Data (`writeFile` tries to write and save an XLSB file)
    XLSX.writeFile(workbook, "Report.xlsb");
  };

  const handleToPrint = useReactToPrint({
    content: () => componentToPrint.current,
    documentTitle: "JLegacy-AI",
    onAfterPrint: () => alert("🖨️ Printing Success 🖨️"),
    pageStyle: `@media print {
            * { overflow: visible !important; } 
            @page {
            size: 210mm 297mm;
            margin: 10mm 5mm 10mm 5mm;
            }
        }`,
  });

  const handleDoc = () => {
    console.log("Converting to Docx");
    console.log(typeof `${componentToPrint.current}`);
  };

  //   const handle

  return (
    <div className="flex justify-end gap-5 items-center">
      <div className=" flex gap-3">
        {[
          {
            image: excel,
            fn: handleToXLSX,
          },
          {
            image: pdf,
            fn: handleToPrint,
          },
          {
            image: doc,
            fn: generateDocx,
          },
        ].map((el, i) => {
          return (
            <img
              key={i}
              src={el.image}
              alt="icon"
              className="w-16 cursor-pointer"
              onClick={() => el.fn()}
            />
          );
        })}
      </div>
    </div>
  );
};

export default ExportButtons;
