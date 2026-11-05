function showWelcome() {

    alert(
        "Welcome to HostelHub Hostel Management System!"
    );

}


const complaintForm =
    document.getElementById("complaintForm");

const complaintList =
    document.getElementById("complaintList");


complaintForm.addEventListener("submit", function(event) {

    event.preventDefault();

    const studentName =
        document.getElementById("studentName").value;

    const roomNumber =
        document.getElementById("roomNumber").value;

    const complaintType =
        document.getElementById("complaintType").value;

    const complaintText =
        document.getElementById("complaintText").value;


    const complaint =
        document.createElement("div");

    complaint.classList.add("complaint");

    complaint.innerHTML = `
        <h3>${complaintType} Complaint</h3>

        <p>
            <b>Student:</b> ${studentName}
        </p>

        <p>
            <b>Room:</b> ${roomNumber}
        </p>

        <p>
            <b>Complaint:</b> ${complaintText}
        </p>

        <p>
            <b>Status:</b> Pending
        </p>
    `;


    complaintList.appendChild(complaint);

    complaintForm.reset();

    alert("Complaint submitted successfully!");

});