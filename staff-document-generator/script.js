/* =====================================================
   STAFF DOCUMENT GENERATOR
   HARIHAR CARGO CARRIERS
===================================================== */


/* =====================================================
   HELPER
===================================================== */

function getValue(id){

    const element = document.getElementById(id);

    if(!element){
        return "";
    }

    return element.value.trim();

}


/* =====================================================
   FORMAT DATE
===================================================== */

function formatDate(dateValue){

    if(!dateValue){
        return "-";
    }

    const date = new Date(dateValue);

    if(isNaN(date.getTime())){
        return dateValue;
    }

    const day = String(date.getDate()).padStart(2,"0");

    const month = String(
        date.getMonth() + 1
    ).padStart(2,"0");

    const year = date.getFullYear();

    return `${day}/${month}/${year}`;

}


/* =====================================================
   SET PREVIEW VALUE
===================================================== */

function setPreview(id,value){

    const element =
        document.getElementById(id);

    if(!element){
        return;
    }

    element.textContent =
        value && value.trim()
        ? value
        : "-";

}


/* =====================================================
   GENERATE DOCUMENT
===================================================== */

function generateDocument(){

    const employeeName =
        getValue("employeeName");

    const fatherName =
        getValue("fatherName");

    const dob =
        getValue("dob");

    const mobile =
        getValue("mobile");

    const address =
        getValue("address");

    const designation =
        getValue("designation");

    const joiningDate =
        getValue("joiningDate");

    const employeeId =
        getValue("employeeId");

    const vehicleNo =
        getValue("vehicleNo");

    const emergencyContact =
        getValue("emergencyContact");

    const documentDate =
        getValue("documentDate");

    const documentNo =
        getValue("documentNo");


    /* ---------------------------------------------
       PREVIEW
    --------------------------------------------- */

    setPreview(
        "previewEmployeeName",
        employeeName
    );

    setPreview(
        "previewFatherName",
        fatherName
    );

    setPreview(
        "previewDob",
        formatDate(dob)
    );

    setPreview(
        "previewMobile",
        mobile
    );

    setPreview(
        "previewAddress",
        address
    );

    setPreview(
        "previewDesignation",
        designation
    );

    setPreview(
        "previewJoiningDate",
        formatDate(joiningDate)
    );

    setPreview(
        "previewEmployeeId",
        employeeId
    );

    setPreview(
        "previewVehicleNo",
        vehicleNo
    );

    setPreview(
        "previewEmergencyContact",
        emergencyContact
    );

    setPreview(
        "previewDocumentDate",
        formatDate(documentDate)
    );

    setPreview(
        "previewDocumentNo",
        documentNo
    );

    setPreview(
        "signatureEmployeeName",
        employeeName || "________________"
    );


    /* ---------------------------------------------
       SCROLL TO DOCUMENT
    --------------------------------------------- */

    document
        .getElementById("document")
        .scrollIntoView({
            behavior:"smooth",
            block:"start"
        });

}


/* =====================================================
   DOWNLOAD PDF
===================================================== */

async function downloadPDF(){

    /*
       Generate latest information first
    */

    generateDocument();


    const documentElement =
        document.getElementById("document");


    if(!documentElement){

        alert(
            "Document could not be found."
        );

        return;

    }


    /*
       Temporarily enable export mode
    */

    document.body.classList.add(
        "export-mode"
    );


    /*
       Small delay so browser can apply CSS
    */

    await new Promise(
        resolve => setTimeout(resolve,300)
    );


    try{

        const canvas =
            await html2canvas(
                documentElement,
                {
                    scale:2,
                    useCORS:true,
                    backgroundColor:"#ffffff",
                    logging:false
                }
            );


        const imageData =
            canvas.toDataURL(
                "image/png"
            );


        const {
            jsPDF
        } = window.jspdf;


        const pdf =
            new jsPDF(
                "p",
                "mm",
                "a4"
            );


        const pageWidth =
            pdf.internal.pageSize.getWidth();

        const pageHeight =
            pdf.internal.pageSize.getHeight();


        pdf.addImage(
            imageData,
            "PNG",
            0,
            0,
            pageWidth,
            pageHeight
        );


        /*
           Generate filename
        */

        const employeeName =
            getValue("employeeName")
            .replace(
                /[^a-zA-Z0-9_-]/g,
                "_"
            );


        const employeeId =
            getValue("employeeId")
            .replace(
                /[^a-zA-Z0-9_-]/g,
                "_"
            );


        let fileName =
            "Harihar_Staff_Document";


        if(employeeName){

            fileName +=
                "_" + employeeName;

        }


        if(employeeId){

            fileName +=
                "_" + employeeId;

        }


        fileName += ".pdf";


        pdf.save(fileName);


    }catch(error){

        console.error(
            "PDF Error:",
            error
        );


        alert(
            "❌ Error generating PDF.\n\n" +
            error.message
        );


    }finally{

        document.body.classList.remove(
            "export-mode"
        );

    }

}


/* =====================================================
   PRINT
===================================================== */

function printDocument(){

    generateDocument();

    setTimeout(
        function(){

            window.print();

        },
        300
    );

}


/* =====================================================
   RESET FORM
===================================================== */

function resetForm(){

    const confirmation =
        confirm(
            "Are you sure you want to clear all employee details?"
        );


    if(!confirmation){
        return;
    }


    const fields = [

        "employeeName",
        "fatherName",
        "dob",
        "mobile",
        "address",
        "designation",
        "joiningDate",
        "employeeId",
        "vehicleNo",
        "emergencyContact",
        "documentDate",
        "documentNo"

    ];


    fields.forEach(
        function(id){

            const element =
                document.getElementById(id);

            if(element){

                element.value = "";

            }

        }
    );


    /*
       Reset preview
    */

    const previews = [

        "previewEmployeeName",
        "previewEmployeeId",
        "previewFatherName",
        "previewDesignation",
        "previewDob",
        "previewJoiningDate",
        "previewMobile",
        "previewVehicleNo",
        "previewEmergencyContact",
        "previewAddress",
        "previewDocumentDate",
        "previewDocumentNo"

    ];


    previews.forEach(
        function(id){

            setPreview(
                id,
                "-"
            );

        }
    );


    setPreview(
        "signatureEmployeeName",
        "________________"
    );

}


/* =====================================================
   AUTO DOCUMENT DATE
===================================================== */

function setTodayDate(){

    const dateInput =
        document.getElementById(
            "documentDate"
        );


    if(!dateInput){
        return;
    }


    /*
       Do not overwrite an existing date
    */

    if(dateInput.value){
        return;
    }


    const today =
        new Date();


    const year =
        today.getFullYear();


    const month =
        String(
            today.getMonth() + 1
        ).padStart(2,"0");


    const day =
        String(
            today.getDate()
        ).padStart(2,"0");


    dateInput.value =
        `${year}-${month}-${day}`;

}


/* =====================================================
   AUTO PREVIEW WHEN TYPING
===================================================== */

function enableLivePreview(){

    const fields = [

        "employeeName",
        "fatherName",
        "dob",
        "mobile",
        "address",
        "designation",
        "joiningDate",
        "employeeId",
        "vehicleNo",
        "emergencyContact",
        "documentDate",
        "documentNo"

    ];


    fields.forEach(
        function(id){

            const element =
                document.getElementById(id);


            if(!element){
                return;
            }


            element.addEventListener(
                "input",
                generateDocument
            );


            element.addEventListener(
                "change",
                generateDocument
            );

        }
    );

}


/* =====================================================
   INITIALIZATION
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function(){

        setTodayDate();

        enableLivePreview();

        generateDocument();

    }
);