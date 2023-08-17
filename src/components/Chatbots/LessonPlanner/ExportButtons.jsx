import React,{useRef} from 'react'
import { useReactToPrint } from 'react-to-print'
import * as XLSX from "xlsx"

import doc from '../../../images/Icons/doc.png'
import docs from '../../../images/Icons/docs.png'
import excel from '../../../images/Icons/excel.png'
import pdf from '../../../images/Icons/pdf.png'


const ExportButtons = ({componentToPrint, answer}) => {

    console.log("Here in Export Button");
    const handleToXLSX = () => {
        
        const table = document.createElement("table")
        const thead = document.createElement("thead")
        const trH = document.createElement("tr")

        const thQ = document.createElement("th")
        thQ.innerText = "Questions"

        const thA = document.createElement("th")
        thA.innerText = "Answer"

        trH.append(thQ)
        trH.append(thA)

        thead.append(trH)

        table.append(thead)

        const tbody = document.createElement("tbody")

        for(let i=0; i<answer.length ; i++){
            const tr = document.createElement("tr")
            if(i==0){
                tr.append(document.createElement("td"))
                const tdAns = document.createElement("td")
                tdAns.innerText = answer[i]["answer"];
                tr.append(tdAns)
                tbody.append(tr)
                continue;
            }
            
            const tdQuestion = document.createElement("td")
            tdQuestion.innerText = answer[i]["question"]

            const tdAnswer = document.createElement("td")
            tdAnswer.innerText = answer[i]["answer"]

            tr.append(tdQuestion)
            tr.append(tdAnswer)

            tbody.append(tr);

        }

        table.append(tbody)

        // Extract Data (create a workbook object from the table)
        var workbook = XLSX.utils.table_to_book(table);

        // Process Data (add a new row)
        var ws = workbook.Sheets["Sheet1"];
        XLSX.utils.sheet_add_aoa(ws, [["Created "+new Date().toISOString()]], {origin:-1});

        // Package and Release Data (`writeFile` tries to write and save an XLSB file)
        XLSX.writeFile(workbook, "Report.xlsb");
    }

    const handleToPrint = useReactToPrint({
        content: () => componentToPrint.current,
        documentTitle: "JLegacy-AI",
        onAfterPrint:  () => alert("🖨️ Printing Success 🖨️"),
        pageStyle: `@media print {
            * { overflow: visible !important; } 
            @page {
            size: 210mm 297mm;
            margin: 10mm 5mm 10mm 5mm;
            }
        }`
    })

    return (
        <div className='flex justify-end gap-5 items-center'>
            {/* <h3 className=' text-2xl font-bold uppercase'>Export</h3> */}
            <div className=' flex gap-3'>
                {/* <button className='px-5 py-2 rounded bg-orange-400  text-white' onClick={async () => await exportToPdf()}>PDF</button>
                <button className='px-5 py-2 rounded bg-orange-400  text-white' onClick={async () => await exportToDocx()}>DOCS</button>
                <button className='px-5 py-2 rounded bg-orange-400  text-white'>Excel</button> */}
                {
                    [
                        {image: doc, fn: handleToXLSX},
                    ].map((el, i) => {
                        return <img key={i} src={el.image} alt="icon" className='w-16' onClick={ () => el.fn()}/>;
                    })
                }
            </div>
        </div>
    )
}

export default ExportButtons