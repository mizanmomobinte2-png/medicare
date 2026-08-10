import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/DoctorDashboard.css";

const API = "http://localhost:5000/api";

function DoctorDashboard() {
  const navigate = useNavigate();

  let storedDoctor = null;

  try {
    storedDoctor = JSON.parse(
      localStorage.getItem("doctor") || "null"
    );
  } catch {
    storedDoctor = null;
  }

  const doctorId = Number(
    storedDoctor?.doctor_id || 0
  );

  const [activePage, setActivePage] =
    useState("overview");

  const [profile, setProfile] =
    useState(null);

  const [appointments, setAppointments] =
    useState([]);

  const [patients, setPatients] =
    useState([]);

  const [timeSlots, setTimeSlots] =
    useState([]);

  const [prescriptions, setPrescriptions] =
    useState([]);

  const [surgeries, setSurgeries] =
    useState([]);

  const [labTests, setLabTests] =
    useState([]);

  const [admissions, setAdmissions] =
    useState([]);

  const [medicalItems, setMedicalItems] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [message, setMessage] =
    useState("");

  const [
    appointmentChanges,
    setAppointmentChanges,
  ] = useState({});

  const [slotForm, setSlotForm] =
    useState({
      slot_date: "",
      start_time: "",
      end_time: "",
      room: "",
    });

  const [
    prescriptionForm,
    setPrescriptionForm,
  ] = useState({
    patient_id: "",
    diagnosis: "",
    advice: "",
    note: "",
    item_id: "",
    quantity: "",
    dosage: "",
  });

  const [labForm, setLabForm] =
    useState({
      patient_id: "",
      test_name: "",
      type: "",
    });

  const [surgeryForm, setSurgeryForm] =
    useState({
      patient_id: "",
      surgery_name: "",
      type: "",
    });

  const [labResultInputs, setLabResultInputs] =
    useState({});

  const getDateOnly = (value) => {
    if (!value) return "";

    return String(value).slice(0, 10);
  };

  const getTimeOnly = (value) => {
    if (!value) return "-";

    return String(value).slice(0, 5);
  };

  const today = new Date()
    .toISOString()
    .slice(0, 10);

  const safeFetch = async (url) => {
    try {
      const response = await fetch(url);

      const text = await response.text();

      let data = null;

      try {
        data = text
          ? JSON.parse(text)
          : null;
      } catch {
        console.error(
          "Invalid JSON:",
          url,
          text
        );
      }

      return {
        ok: response.ok,
        data,
      };
    } catch (error) {
      console.error(
        "Fetch failed:",
        url,
        error
      );

      return {
        ok: false,
        data: null,
      };
    }
  };

  const loadData = async () => {
    if (!doctorId) {
      navigate("/login");
      return;
    }

    setLoading(true);

    try {
      const [
        profileResult,
        appointmentResult,
        patientResult,
        slotResult,
        prescriptionResult,
        surgeryResult,
        labResult,
        admissionResult,
        medicalItemResult,
      ] = await Promise.all([
        safeFetch(
          `${API}/doctors/${doctorId}`
        ),

        safeFetch(
          `${API}/appointments/doctor/${doctorId}`
        ),

        safeFetch(
          `${API}/appointments/doctor/${doctorId}/patients`
        ),

        safeFetch(
          `${API}/time-slots/doctor/${doctorId}`
        ),

        safeFetch(
          `${API}/prescriptions/doctor/${doctorId}`
        ),

        safeFetch(
          `${API}/surgeries/doctor/${doctorId}`
        ),

        safeFetch(
          `${API}/lab-tests/doctor/${doctorId}`
        ),

        safeFetch(
          `${API}/admissions/doctor/${doctorId}`
        ),

        safeFetch(
          `${API}/medical-items`
        ),
      ]);

      if (
        profileResult.ok &&
        profileResult.data
      ) {
        setProfile(profileResult.data);
      }

      setAppointments(
        Array.isArray(
          appointmentResult.data
        )
          ? appointmentResult.data
          : []
      );

      setPatients(
        Array.isArray(
          patientResult.data
        )
          ? patientResult.data
          : []
      );

      setTimeSlots(
        Array.isArray(
          slotResult.data
        )
          ? slotResult.data
          : []
      );

      setPrescriptions(
        Array.isArray(
          prescriptionResult.data
        )
          ? prescriptionResult.data
          : []
      );

      setSurgeries(
        Array.isArray(
          surgeryResult.data
        )
          ? surgeryResult.data
          : []
      );

      setLabTests(
        Array.isArray(
          labResult.data
        )
          ? labResult.data
          : []
      );

      setAdmissions(
        Array.isArray(
          admissionResult.data
        )
          ? admissionResult.data
          : []
      );

      setMedicalItems(
        Array.isArray(
          medicalItemResult.data
        )
          ? medicalItemResult.data
          : []
      );
    } catch (error) {
      console.error(error);

      setMessage(
        "Could not load some dashboard data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [doctorId]);

  const todayAppointments =
    appointments.filter(
      (appointment) =>
        getDateOnly(
          appointment.appt_date
        ) === today &&
        ![
          "cancelled",
          "rejected",
        ].includes(
          appointment.status
        )
    );

  const upcomingAppointments =
    appointments.filter(
      (appointment) =>
        getDateOnly(
          appointment.appt_date
        ) >= today &&
        ![
          "completed",
          "cancelled",
          "rejected",
        ].includes(
          appointment.status
        )
    );

  const availableSlots =
    timeSlots.filter(
      (slot) =>
        slot.status ===
          "available" &&
        getDateOnly(
          slot.slot_date
        ) >= today
    );

  const pendingAdmissions =
    admissions.filter(
      (admission) =>
        admission.status ===
        "pending"
    );

  const scheduledLabTests =
    labTests.filter(
      (test) =>
        test.status ===
        "scheduled"
    );

  const scheduledSurgeries =
    surgeries.filter(
      (surgery) =>
        surgery.status ===
        "scheduled"
    );

  const changeAppointmentField = (
    appointmentId,
    field,
    value
  ) => {
    setAppointmentChanges(
      (previous) => ({
        ...previous,

        [appointmentId]: {
          ...previous[
            appointmentId
          ],

          [field]: value,
        },
      })
    );
  };

  const updateAppointment = async (
    appointment
  ) => {
    const changes =
      appointmentChanges[
        appointment.appt_id
      ] || {};

    try {
      setMessage("");

      const response = await fetch(
        `${API}/appointments/${appointment.appt_id}/doctor-update`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            status:
              changes.status ||
              appointment.status,

            notes:
              changes.notes !==
              undefined
                ? changes.notes
                : appointment.notes,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setMessage(
          data.error ||
            "Appointment update failed."
        );

        return;
      }

      setMessage(
        "Appointment updated successfully."
      );

      await loadData();
    } catch (error) {
      console.error(error);

      setMessage(
        "Server connection failed."
      );
    }
  };

  const recommendAdmission = async (
    appointment
  ) => {
    const existing =
      admissions.find(
        (admission) =>
          Number(
            admission.appointment_id
          ) ===
          Number(
            appointment.appt_id
          )
      );

    if (existing) {
      setMessage(
        `Admission already recommended. Status: ${existing.status}`
      );

      return;
    }

    try {
      const response = await fetch(
        `${API}/admissions/doctor/recommend`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            doctor_id: doctorId,

            appointment_id:
              appointment.appt_id,

            notes:
              appointment.notes ||
              null,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setMessage(
          data.error ||
            "Admission recommendation failed."
        );

        return;
      }

      setMessage(
        "Admission recommended successfully."
      );

      await loadData();
    } catch (error) {
      console.error(error);

      setMessage(
        "Server connection failed."
      );
    }
  };

  const createTimeSlot = async (
    event
  ) => {
    event.preventDefault();

    try {
      const response = await fetch(
        `${API}/time-slots`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            doctor_id: doctorId,
            ...slotForm,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setMessage(
          data.error ||
            "Could not create slot."
        );

        return;
      }

      setMessage(
        "Time slot created successfully."
      );

      setSlotForm({
        slot_date: "",
        start_time: "",
        end_time: "",
        room: "",
      });

      await loadData();
    } catch (error) {
      console.error(error);

      setMessage(
        "Server connection failed."
      );
    }
  };

  const updateSlotStatus = async (
    slotId,
    status
  ) => {
    try {
      const response = await fetch(
        `${API}/time-slots/${slotId}/status`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            status,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setMessage(
          data.error ||
            "Could not update slot."
        );

        return;
      }

      await loadData();
    } catch (error) {
      console.error(error);
    }
  };

  const createPrescription = async (
    event
  ) => {
    event.preventDefault();

    const items = [];

    if (
      prescriptionForm.item_id
    ) {
      items.push({
        item_id: Number(
          prescriptionForm.item_id
        ),

        quantity:
          Number(
            prescriptionForm.quantity
          ) || 1,

        dosage:
          prescriptionForm.dosage ||
          null,
      });
    }

    try {
      const response = await fetch(
        `${API}/prescriptions`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            patient_id: Number(
              prescriptionForm.patient_id
            ),

            doctor_id: doctorId,

            diagnosis:
              prescriptionForm.diagnosis,

            advice:
              prescriptionForm.advice,

            note:
              prescriptionForm.note,

            items,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setMessage(
          data.error ||
            "Prescription creation failed."
        );

        return;
      }

      setMessage(
        "Prescription created successfully."
      );

      setPrescriptionForm({
        patient_id: "",
        diagnosis: "",
        advice: "",
        note: "",
        item_id: "",
        quantity: "",
        dosage: "",
      });

      await loadData();
    } catch (error) {
      console.error(error);
    }
  };

  const orderLabTest = async (
    event
  ) => {
    event.preventDefault();

    try {
      const response = await fetch(
        `${API}/lab-tests/doctor/order`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            patient_id: Number(
              labForm.patient_id
            ),

            doctor_id: doctorId,

            test_name:
              labForm.test_name,

            type:
              labForm.type ||
              null,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setMessage(
          data.error ||
            "Lab test order failed."
        );

        return;
      }

      setMessage(
        "Lab test ordered successfully. Staff will schedule it."
      );

      setLabForm({
        patient_id: "",
        test_name: "",
        type: "",
      });

      await loadData();
    } catch (error) {
      console.error(error);

      setMessage(
        "Server connection failed."
      );
    }
  };

  const completeLabTest = async (
    test
  ) => {
    const result =
      labResultInputs[
        test.test_id
      ];

    if (!result) {
      setMessage(
        "Please enter the lab result first."
      );

      return;
    }

    try {
      const response = await fetch(
        `${API}/lab-tests/${test.test_id}/doctor-complete`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            doctor_id: doctorId,
            result,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setMessage(
          data.error ||
            "Could not complete lab test."
        );

        return;
      }

      setMessage(
        "Lab result completed successfully."
      );

      setLabResultInputs(
        (previous) => ({
          ...previous,
          [test.test_id]: "",
        })
      );

      await loadData();
    } catch (error) {
      console.error(error);
    }
  };

  const recommendSurgery = async (
    event
  ) => {
    event.preventDefault();

    try {
      const response = await fetch(
        `${API}/surgeries/doctor/recommend`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            patient_id: Number(
              surgeryForm.patient_id
            ),

            doctor_id: doctorId,

            surgery_name:
              surgeryForm.surgery_name,

            type:
              surgeryForm.type ||
              null,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setMessage(
          data.error ||
            "Surgery recommendation failed."
        );

        return;
      }

      setMessage(
        "Surgery recommended successfully. Staff will schedule it."
      );

      setSurgeryForm({
        patient_id: "",
        surgery_name: "",
        type: "",
      });

      await loadData();
    } catch (error) {
      console.error(error);
    }
  };

  const completeSurgery = async (
    surgeryId
  ) => {
    try {
      const response = await fetch(
        `${API}/surgeries/${surgeryId}/doctor-complete`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            doctor_id: doctorId,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setMessage(
          data.error ||
            "Could not complete surgery."
        );

        return;
      }

      setMessage(
        "Surgery marked completed."
      );

      await loadData();
    } catch (error) {
      console.error(error);
    }
  };

  const logout = () => {
    localStorage.removeItem(
      "doctor"
    );

    localStorage.removeItem(
      "role"
    );

    navigate("/login");
  };

  if (loading) {
    return (
      <div className="doctor-loading">
        Loading doctor dashboard...
      </div>
    );
  }

  return (
    <div className="doctor-dashboard">

      <aside className="doctor-sidebar">

        <div className="doctor-brand">
          MediCare
        </div>

        <p className="doctor-sidebar-name">
          {profile?.name ||
            `Doctor ${doctorId}`}
        </p>

        <button
          onClick={() =>
            setActivePage(
              "overview"
            )
          }
        >
          Dashboard
        </button>

        <button
          onClick={() =>
            setActivePage(
              "profile"
            )
          }
        >
          My Profile
        </button>

        <button
          onClick={() =>
            setActivePage(
              "appointments"
            )
          }
        >
          My Appointments
        </button>

        <button
          onClick={() =>
            setActivePage(
              "patients"
            )
          }
        >
          My Patients
        </button>

        <button
          onClick={() =>
            setActivePage(
              "slots"
            )
          }
        >
          Time Slots
        </button>

        <button
          onClick={() =>
            setActivePage(
              "prescriptions"
            )
          }
        >
          Prescriptions
        </button>

        <button
          onClick={() =>
            setActivePage(
              "labtests"
            )
          }
        >
          Lab Tests
        </button>

        <button
          onClick={() =>
            setActivePage(
              "surgeries"
            )
          }
        >
          Surgeries
        </button>

        <button
          className="logout-button"
          onClick={logout}
        >
          Logout
        </button>

      </aside>

      <main className="doctor-main">

        {message && (
          <div className="doctor-message">
            {message}
          </div>
        )}

        {activePage ===
          "overview" && (
          <>
            <h1>
              Doctor Dashboard
            </h1>

            <p>
              Welcome,{" "}
              <strong>
                {profile?.name ||
                  doctorId}
              </strong>
            </p>

            <div className="summary-grid">

              <div className="summary-box">
                <h3>
                  Today's Appointments
                </h3>
                <p>
                  {
                    todayAppointments.length
                  }
                </p>
              </div>

              <div className="summary-box">
                <h3>
                  Upcoming Appointments
                </h3>
                <p>
                  {
                    upcomingAppointments.length
                  }
                </p>
              </div>

              <div className="summary-box">
                <h3>
                  Available Slots
                </h3>
                <p>
                  {
                    availableSlots.length
                  }
                </p>
              </div>

              <div className="summary-box">
                <h3>
                  Prescriptions
                </h3>
                <p>
                  {
                    prescriptions.length
                  }
                </p>
              </div>

              <div className="summary-box">
                <h3>
                  Scheduled Lab Tests
                </h3>
                <p>
                  {
                    scheduledLabTests.length
                  }
                </p>
              </div>

              <div className="summary-box">
                <h3>
                  Scheduled Surgeries
                </h3>
                <p>
                  {
                    scheduledSurgeries.length
                  }
                </p>
              </div>

              <div className="summary-box">
                <h3>
                  Patients
                </h3>
                <p>
                  {patients.length}
                </p>
              </div>

              <div className="summary-box">
                <h3>
                  Pending Admissions
                </h3>
                <p>
                  {
                    pendingAdmissions.length
                  }
                </p>
              </div>

            </div>
          </>
        )}

        {activePage ===
          "profile" && (
          <section className="doctor-section">

            <h1>My Profile</h1>

            <p>
              <strong>ID:</strong>{" "}
              {profile?.doctor_id ||
                doctorId}
            </p>

            <p>
              <strong>Name:</strong>{" "}
              {profile?.name || "-"}
            </p>

            <p>
              <strong>Email:</strong>{" "}
              {profile?.email || "-"}
            </p>

            <p>
              <strong>Phone:</strong>{" "}
              {profile?.phone || "-"}
            </p>

            <p>
              <strong>
                Specialization:
              </strong>{" "}
              {profile?.specialization ||
                profile?.specification ||
                "-"}
            </p>

            <p>
              <strong>
                Department:
              </strong>{" "}
              {profile?.dept_name ||
                "-"}
            </p>

          </section>
        )}

        {activePage ===
          "appointments" && (
          <section className="doctor-section">

            <h1>
              My Appointments
            </h1>

            <div className="table-wrapper">

              <table>

                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Taken By</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Notes</th>
                    <th>Admission</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>

                  {appointments.map(
                    (appointment) => {
                      const admission =
                        admissions.find(
                          (item) =>
                            Number(
                              item.appointment_id
                            ) ===
                            Number(
                              appointment.appt_id
                            )
                        );

                      return (
                        <tr
                          key={
                            appointment.appt_id
                          }
                        >

                          <td>
                            {appointment.patient_name ||
                              "-"}
                          </td>

                          <td>
                            {appointment.staff_name ||
                              "Not Assigned"}
                          </td>

                          <td>
                            {getDateOnly(
                              appointment.appt_date
                            )}
                          </td>

                          <td>
                            {getTimeOnly(
                              appointment.appt_time
                            )}
                          </td>

                          <td>
                            {appointment.reason ||
                              "-"}
                          </td>

                          <td>
                            <select
                              value={
                                appointmentChanges[
                                  appointment
                                    .appt_id
                                ]?.status ??
                                appointment.status
                              }
                              onChange={(e) =>
                                changeAppointmentField(
                                  appointment.appt_id,
                                  "status",
                                  e.target.value
                                )
                              }
                            >
                              <option value="pending">
                                Pending
                              </option>
                              <option value="confirmed">
                                Confirmed
                              </option>
                              <option value="completed">
                                Completed
                              </option>
                              <option value="rejected">
                                Rejected
                              </option>
                              <option value="cancelled">
                                Cancelled
                              </option>
                            </select>
                          </td>

                          <td>
                            <input
                              value={
                                appointmentChanges[
                                  appointment
                                    .appt_id
                                ]?.notes ??
                                appointment.notes ??
                                ""
                              }
                              onChange={(e) =>
                                changeAppointmentField(
                                  appointment.appt_id,
                                  "notes",
                                  e.target.value
                                )
                              }
                            />
                          </td>

                          <td>
                            {admission ? (
                              `Recommended (${admission.status})`
                            ) : [
                                "confirmed",
                                "completed",
                              ].includes(
                                appointment.status
                              ) ? (
                              <button
                                onClick={() =>
                                  recommendAdmission(
                                    appointment
                                  )
                                }
                              >
                                Recommend Admission
                              </button>
                            ) : (
                              "-"
                            )}
                          </td>

                          <td>
                            <button
                              onClick={() =>
                                updateAppointment(
                                  appointment
                                )
                              }
                            >
                              Save
                            </button>
                          </td>

                        </tr>
                      );
                    }
                  )}

                  {appointments.length ===
                    0 && (
                    <tr>
                      <td colSpan="9">
                        No appointments found.
                      </td>
                    </tr>
                  )}

                </tbody>

              </table>

            </div>

          </section>
        )}

        {activePage ===
          "patients" && (
          <section className="doctor-section">

            <h1>My Patients</h1>

            <div className="table-wrapper">

              <table>

                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Gender</th>
                    <th>
                      Blood Group
                    </th>
                  </tr>
                </thead>

                <tbody>

                  {patients.map(
                    (patient) => (
                      <tr
                        key={
                          patient.patient_id
                        }
                      >
                        <td>
                          {
                            patient.patient_id
                          }
                        </td>

                        <td>
                          {patient.name ||
                            patient.patient_name ||
                            "-"}
                        </td>

                        <td>
                          {patient.email ||
                            "-"}
                        </td>

                        <td>
                          {patient.phone ||
                            "-"}
                        </td>

                        <td>
                          {patient.gender ||
                            "-"}
                        </td>

                        <td>
                          {patient.blood_group ||
                            "-"}
                        </td>
                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>

          </section>
        )}

        {activePage ===
          "slots" && (
          <>
            <section className="doctor-section">

              <h1>Time Slots</h1>

              <form
                className="doctor-form"
                onSubmit={
                  createTimeSlot
                }
              >

                <label>Date</label>
                <input
                  type="date"
                  value={
                    slotForm.slot_date
                  }
                  onChange={(e) =>
                    setSlotForm({
                      ...slotForm,
                      slot_date:
                        e.target.value,
                    })
                  }
                  required
                />

                <label>
                  Start Time
                </label>
                <input
                  type="time"
                  value={
                    slotForm.start_time
                  }
                  onChange={(e) =>
                    setSlotForm({
                      ...slotForm,
                      start_time:
                        e.target.value,
                    })
                  }
                  required
                />

                <label>
                  End Time
                </label>
                <input
                  type="time"
                  value={
                    slotForm.end_time
                  }
                  onChange={(e) =>
                    setSlotForm({
                      ...slotForm,
                      end_time:
                        e.target.value,
                    })
                  }
                  required
                />

                <label>Room</label>
                <input
                  value={
                    slotForm.room
                  }
                  onChange={(e) =>
                    setSlotForm({
                      ...slotForm,
                      room:
                        e.target.value,
                    })
                  }
                />

                <button type="submit">
                  Add Time Slot
                </button>

              </form>

            </section>

            <section className="doctor-section">

              <div className="table-wrapper">

                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Start</th>
                      <th>End</th>
                      <th>Room</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {timeSlots.map(
                      (slot) => (
                        <tr
                          key={
                            slot.slot_id
                          }
                        >
                          <td>
                            {getDateOnly(
                              slot.slot_date
                            )}
                          </td>

                          <td>
                            {getTimeOnly(
                              slot.start_time
                            )}
                          </td>

                          <td>
                            {getTimeOnly(
                              slot.end_time
                            )}
                          </td>

                          <td>
                            {slot.room ||
                              "-"}
                          </td>

                          <td>
                            <select
                              value={
                                slot.status
                              }
                              onChange={(e) =>
                                updateSlotStatus(
                                  slot.slot_id,
                                  e.target.value
                                )
                              }
                            >
                              <option value="available">
                                Available
                              </option>
                              <option value="booked">
                                Booked
                              </option>
                              <option value="unavailable">
                                Unavailable
                              </option>
                            </select>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>

              </div>

            </section>
          </>
        )}

        {activePage ===
          "prescriptions" && (
          <>
            <section className="doctor-section">

              <h1>Prescriptions</h1>

              <form
                className="doctor-form"
                onSubmit={
                  createPrescription
                }
              >

                <label>Patient</label>

                <select
                  value={
                    prescriptionForm.patient_id
                  }
                  onChange={(e) =>
                    setPrescriptionForm({
                      ...prescriptionForm,
                      patient_id:
                        e.target.value,
                    })
                  }
                  required
                >
                  <option value="">
                    Select Patient
                  </option>

                  {patients.map(
                    (patient) => (
                      <option
                        key={
                          patient.patient_id
                        }
                        value={
                          patient.patient_id
                        }
                      >
                        {patient.name ||
                          patient.patient_name}
                      </option>
                    )
                  )}
                </select>

                <label>
                  Diagnosis
                </label>

                <input
                  value={
                    prescriptionForm.diagnosis
                  }
                  onChange={(e) =>
                    setPrescriptionForm({
                      ...prescriptionForm,
                      diagnosis:
                        e.target.value,
                    })
                  }
                  required
                />

                <label>Advice</label>

                <input
                  value={
                    prescriptionForm.advice
                  }
                  onChange={(e) =>
                    setPrescriptionForm({
                      ...prescriptionForm,
                      advice:
                        e.target.value,
                    })
                  }
                />

                <label>Note</label>

                <input
                  value={
                    prescriptionForm.note
                  }
                  onChange={(e) =>
                    setPrescriptionForm({
                      ...prescriptionForm,
                      note:
                        e.target.value,
                    })
                  }
                />

                <label>
                  Medicine
                </label>

                <select
                  value={
                    prescriptionForm.item_id
                  }
                  onChange={(e) =>
                    setPrescriptionForm({
                      ...prescriptionForm,
                      item_id:
                        e.target.value,
                    })
                  }
                >
                  <option value="">
                    Select Item
                  </option>

                  {medicalItems.map(
                    (item) => (
                      <option
                        key={
                          item.item_id
                        }
                        value={
                          item.item_id
                        }
                      >
                        {
                          item.item_name
                        }
                      </option>
                    )
                  )}
                </select>

                <label>
                  Quantity
                </label>

                <input
                  type="number"
                  value={
                    prescriptionForm.quantity
                  }
                  onChange={(e) =>
                    setPrescriptionForm({
                      ...prescriptionForm,
                      quantity:
                        e.target.value,
                    })
                  }
                />

                <label>Dosage</label>

                <input
                  value={
                    prescriptionForm.dosage
                  }
                  onChange={(e) =>
                    setPrescriptionForm({
                      ...prescriptionForm,
                      dosage:
                        e.target.value,
                    })
                  }
                />

                <button type="submit">
                  Create Prescription
                </button>

              </form>

            </section>

            <section className="doctor-section">

              <h2>
                Prescription History
              </h2>

              <div className="table-wrapper">

                <table>

                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Patient</th>
                      <th>Diagnosis</th>
                      <th>Advice</th>
                      <th>Note</th>
                    </tr>
                  </thead>

                  <tbody>
                    {prescriptions.map(
                      (prescription) => (
                        <tr
                          key={
                            prescription.pres_id
                          }
                        >
                          <td>
                            {
                              prescription.pres_id
                            }
                          </td>

                          <td>
                            {prescription.patient_name ||
                              "-"}
                          </td>

                          <td>
                            {prescription.diagnosis ||
                              "-"}
                          </td>

                          <td>
                            {prescription.advice ||
                              "-"}
                          </td>

                          <td>
                            {prescription.note ||
                              "-"}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>

                </table>

              </div>

            </section>
          </>
        )}

        {activePage ===
          "labtests" && (
          <>
            <section className="doctor-section">

              <h1>
                Order Lab Test
              </h1>

              <form
                className="doctor-form"
                onSubmit={
                  orderLabTest
                }
              >

                <label>Patient</label>

                <select
                  value={
                    labForm.patient_id
                  }
                  onChange={(e) =>
                    setLabForm({
                      ...labForm,
                      patient_id:
                        e.target.value,
                    })
                  }
                  required
                >
                  <option value="">
                    Select Patient
                  </option>

                  {patients.map(
                    (patient) => (
                      <option
                        key={
                          patient.patient_id
                        }
                        value={
                          patient.patient_id
                        }
                      >
                        {patient.name ||
                          patient.patient_name}
                      </option>
                    )
                  )}
                </select>

                <label>
                  Test Name
                </label>

                <input
                  value={
                    labForm.test_name
                  }
                  onChange={(e) =>
                    setLabForm({
                      ...labForm,
                      test_name:
                        e.target.value,
                    })
                  }
                  required
                />

                <label>Type</label>

                <input
                  value={
                    labForm.type
                  }
                  onChange={(e) =>
                    setLabForm({
                      ...labForm,
                      type:
                        e.target.value,
                    })
                  }
                />

                <button type="submit">
                  Order Lab Test
                </button>

              </form>

            </section>

            <section className="doctor-section">

              <h2>
                My Lab Tests
              </h2>

              <div className="table-wrapper">

                <table>

                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Test</th>
                      <th>Type</th>
                      <th>Date</th>
                      <th>Staff</th>
                      <th>Price</th>
                      <th>Status</th>
                      <th>Result</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>

                    {labTests.map(
                      (test) => (
                        <tr
                          key={
                            test.test_id
                          }
                        >

                          <td>
                            {test.patient_name ||
                              "-"}
                          </td>

                          <td>
                            {test.test_name ||
                              "-"}
                          </td>

                          <td>
                            {test.type ||
                              "-"}
                          </td>

                          <td>
                            {getDateOnly(
                              test.date
                            ) || "-"}
                          </td>

                          <td>
                            {test.staff_name ||
                              "Not Assigned"}
                          </td>

                          <td>
                            {test.unit_price ||
                              "-"}
                          </td>

                          <td>
                            {
                              test.status
                            }
                          </td>

                          <td>
                            {test.status ===
                            "completed" ? (
                              test.result ||
                              "-"
                            ) : (
                              <input
                                placeholder="Enter result"
                                value={
                                  labResultInputs[
                                    test.test_id
                                  ] || ""
                                }
                                onChange={(e) =>
                                  setLabResultInputs({
                                    ...labResultInputs,

                                    [test.test_id]:
                                      e
                                        .target
                                        .value,
                                  })
                                }
                              />
                            )}
                          </td>

                          <td>
                            {test.status ===
                            "scheduled" ? (
                              <button
                                onClick={() =>
                                  completeLabTest(
                                    test
                                  )
                                }
                              >
                                Complete Result
                              </button>
                            ) : (
                              "-"
                            )}
                          </td>

                        </tr>
                      )
                    )}

                    {labTests.length ===
                      0 && (
                      <tr>
                        <td colSpan="9">
                          No lab tests found.
                        </td>
                      </tr>
                    )}

                  </tbody>

                </table>

              </div>

            </section>
          </>
        )}

        {activePage ===
          "surgeries" && (
          <>
            <section className="doctor-section">

              <h1>
                Recommend Surgery
              </h1>

              <form
                className="doctor-form"
                onSubmit={
                  recommendSurgery
                }
              >

                <label>Patient</label>

                <select
                  value={
                    surgeryForm.patient_id
                  }
                  onChange={(e) =>
                    setSurgeryForm({
                      ...surgeryForm,
                      patient_id:
                        e.target.value,
                    })
                  }
                  required
                >
                  <option value="">
                    Select Patient
                  </option>

                  {patients.map(
                    (patient) => (
                      <option
                        key={
                          patient.patient_id
                        }
                        value={
                          patient.patient_id
                        }
                      >
                        {patient.name ||
                          patient.patient_name}
                      </option>
                    )
                  )}
                </select>

                <label>
                  Surgery Name
                </label>

                <input
                  value={
                    surgeryForm.surgery_name
                  }
                  onChange={(e) =>
                    setSurgeryForm({
                      ...surgeryForm,
                      surgery_name:
                        e.target.value,
                    })
                  }
                  required
                />

                <label>Type</label>

                <input
                  value={
                    surgeryForm.type
                  }
                  onChange={(e) =>
                    setSurgeryForm({
                      ...surgeryForm,
                      type:
                        e.target.value,
                    })
                  }
                />

                <button type="submit">
                  Recommend Surgery
                </button>

              </form>

            </section>

            <section className="doctor-section">

              <h2>
                My Surgeries
              </h2>

              <div className="table-wrapper">

                <table>

                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Surgery</th>
                      <th>Type</th>
                      <th>Date</th>
                      <th>Staff</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>

                    {surgeries.map(
                      (surgery) => (
                        <tr
                          key={
                            surgery.surgery_id
                          }
                        >

                          <td>
                            {surgery.patient_name ||
                              "-"}
                          </td>

                          <td>
                            {surgery.surgery_name ||
                              "-"}
                          </td>

                          <td>
                            {surgery.type ||
                              "-"}
                          </td>

                          <td>
                            {getDateOnly(
                              surgery.date
                            ) || "-"}
                          </td>

                          <td>
                            {surgery.staff_name ||
                              "Not Assigned"}
                          </td>

                          <td>
                            {
                              surgery.status
                            }
                          </td>

                          <td>
                            {surgery.status ===
                            "scheduled" ? (
                              <button
                                onClick={() =>
                                  completeSurgery(
                                    surgery.surgery_id
                                  )
                                }
                              >
                                Mark Completed
                              </button>
                            ) : (
                              "-"
                            )}
                          </td>

                        </tr>
                      )
                    )}

                    {surgeries.length ===
                      0 && (
                      <tr>
                        <td colSpan="7">
                          No surgeries found.
                        </td>
                      </tr>
                    )}

                  </tbody>

                </table>

              </div>

            </section>
          </>
        )}

      </main>
    </div>
  );
}

export default DoctorDashboard;