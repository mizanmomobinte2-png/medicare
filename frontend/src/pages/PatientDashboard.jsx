import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import "../styles/PatientDashboard.css";

const API =
  "http://localhost:5000/api";

function PatientDashboard() {
  const navigate =
    useNavigate();

  let storedPatient = null;

  try {
    storedPatient =
      JSON.parse(
        localStorage.getItem(
          "patient"
        ) || "null"
      );
  } catch {
    storedPatient = null;
  }

  const patientId =
    Number(
      storedPatient?.patient_id ||
      0
    );

  const [
    activePage,
    setActivePage,
  ] = useState(
    "overview"
  );

  const [
    profile,
    setProfile,
  ] = useState(null);

  const [
    appointments,
    setAppointments,
  ] = useState([]);

  const [
    prescriptions,
    setPrescriptions,
  ] = useState([]);

  const [
    prescriptionItems,
    setPrescriptionItems,
  ] = useState([]);

  const [
    labTests,
    setLabTests,
  ] = useState([]);

  const [
    surgeries,
    setSurgeries,
  ] = useState([]);

  const [
    admissions,
    setAdmissions,
  ] = useState([]);

  const [
    insurance,
    setInsurance,
  ] = useState([]);

  const [
    complaints,
    setComplaints,
  ] = useState([]);

  const [
    doctors,
    setDoctors,
  ] = useState([]);

  const [
    staff,
    setStaff,
  ] = useState([]);

  const [
    bills,
    setBills,
  ] = useState([]);

  const [
    payments,
    setPayments,
  ] = useState([]);

  const [
    slots,
    setSlots,
  ] = useState([]);

  const [
    insuranceSchema,
    setInsuranceSchema,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    doctorSearch,
    setDoctorSearch,
  ] = useState("");

  const [
    profileForm,
    setProfileForm,
  ] = useState({
    name: "",
    email: "",
    phone: "",
    dob: "",
    gender: "",
    blood_group: "",
    address: "",
    password: "",
  });

  const [
    appointmentForm,
    setAppointmentForm,
  ] = useState({
    doctor_id: "",
    slot_id: "",
    reason: "",
    notes: "",
  });

  const [
    paymentForm,
    setPaymentForm,
  ] = useState({
    bill_id: "",
    amount: "",
    method: "cash",
    ref_no: "",
    notes: "",
  });

  const [
    complaintForm,
    setComplaintForm,
  ] = useState({
    target_type: "doctor",
    target_id: "",
    complaint_type: "",
    description: "",
  });

  const [
    insuranceForm,
    setInsuranceForm,
  ] = useState({});

  const dateOnly = (
    value
  ) => {
    if (!value) return "";

    return String(
      value
    ).slice(0, 10);
  };

  const timeOnly = (
    value
  ) => {
    if (!value) return "-";

    return String(
      value
    ).slice(0, 5);
  };

  const money = (
    value
  ) =>
    Number(
      value || 0
    ).toFixed(2);

  const doctorName = (
    doctor
  ) =>
    doctor.name ||
    doctor.full_name ||
    `Doctor #${doctor.doctor_id}`;

 const safeFetch = async (url) => {
  try {
    const token = localStorage.getItem("token");

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",

        Authorization: token
          ? `Bearer ${token}`
          : "",
      },
    });

    const text = await response.text();

    let data = null;

    try {
      data = text ? JSON.parse(text) : null;
    } catch (error) {
      console.error(
        "Invalid JSON response:",
        text
      );
    }

    return {
      ok: response.ok,
      data: data,
    };

  } catch (error) {

    console.error(
      "Fetch error:",
      error
    );

    return {
      ok: false,
      data: null,
    };
  }
};
  const loadAll =
    async () => {
      if (!patientId) {
        navigate(
          "/login"
        );

        return;
      }

      setLoading(true);

      try {
        const [
          dashboardResult,
          doctorResult,
          staffResult,
          billResult,
          paymentResult,
          insuranceSchemaResult,
          labResult,
          surgeryResult,
        ] =
          await Promise.all(
            [
              safeFetch(
                `${API}/patient-dashboard/data/${patientId}`
              ),

              safeFetch(
                `${API}/doctors`
              ),

              safeFetch(
                `${API}/staff`
              ),

              safeFetch(
                `${API}/billing/patient/${patientId}`
              ),

              safeFetch(
                `${API}/payments/patient/${patientId}`
              ),

              safeFetch(
                `${API}/patient-dashboard/insurance-schema`
              ),

              safeFetch(
                `${API}/lab-tests/patient/${patientId}`
              ),

              safeFetch(
                `${API}/surgeries/patient/${patientId}`
              ),
            ]
          );

        const dashboard =
          dashboardResult.data ||
          {};

        setProfile(
          dashboard.profile ||
            null
        );

        setAppointments(
          Array.isArray(
            dashboard.appointments
          )
            ? dashboard.appointments
            : []
        );

        setPrescriptions(
          Array.isArray(
            dashboard.prescriptions
          )
            ? dashboard.prescriptions
            : []
        );

        setPrescriptionItems(
          Array.isArray(
            dashboard.prescription_items
          )
            ? dashboard.prescription_items
            : []
        );

        setAdmissions(
          Array.isArray(
            dashboard.admissions
          )
            ? dashboard.admissions
            : []
        );

        setInsurance(
          Array.isArray(
            dashboard.insurance
          )
            ? dashboard.insurance
            : []
        );

        setComplaints(
          Array.isArray(
            dashboard.complaints
          )
            ? dashboard.complaints
            : []
        );

        setLabTests(
          Array.isArray(
            labResult.data
          )
            ? labResult.data
            : []
        );

        setSurgeries(
          Array.isArray(
            surgeryResult.data
          )
            ? surgeryResult.data
            : []
        );

        if (
          dashboard.profile
        ) {
          setProfileForm({
            name:
              dashboard.profile
                .name || "",

            email:
              dashboard.profile
                .email || "",

            phone:
              dashboard.profile
                .phone || "",

            dob:
              dateOnly(
                dashboard.profile
                  .dob
              ),

            gender:
              dashboard.profile
                .gender || "",

            blood_group:
              dashboard.profile
                .blood_group ||
              "",

            address:
              dashboard.profile
                .address || "",

            password: "",
          });
        }

        setDoctors(
          Array.isArray(
            doctorResult.data
          )
            ? doctorResult.data
            : []
        );

        setStaff(
          Array.isArray(
            staffResult.data
          )
            ? staffResult.data
            : []
        );

        setBills(
          Array.isArray(
            billResult.data
          )
            ? billResult.data
            : []
        );

        setPayments(
          Array.isArray(
            paymentResult.data
          )
            ? paymentResult.data
            : []
        );

        setInsuranceSchema(
          Array.isArray(
            insuranceSchemaResult.data
          )
            ? insuranceSchemaResult.data
            : []
        );
      } catch (error) {
        console.error(
          error
        );

        setMessage(
          "Could not load some patient dashboard information."
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    loadAll();
  }, [patientId]);

  useEffect(() => {
    const loadSlots =
      async () => {
        if (
          !appointmentForm
            .doctor_id
        ) {
          setSlots([]);

          return;
        }

        const result =
          await safeFetch(
            `${API}/time-slots/doctor/${appointmentForm.doctor_id}`
          );

        setSlots(
          Array.isArray(
            result.data
          )
            ? result.data.filter(
                (slot) =>
                  slot.status ===
                  "available"
              )
            : []
        );
      };

    loadSlots();
  }, [
    appointmentForm.doctor_id,
  ]);

  const visibleDoctors =
    useMemo(() => {
      const search =
        doctorSearch
          .toLowerCase()
          .trim();

      return doctors.filter(
        (doctor) => {
          const status =
            String(
              doctor.approval_status ||
                doctor.status ||
                ""
            ).toLowerCase();

          if (
            status &&
            ![
              "approved",
              "active",
            ].includes(
              status
            )
          ) {
            return false;
          }

          if (!search) {
            return true;
          }

          return [
            doctor.name,
            doctor.full_name,
            doctor.specialization,
            doctor.specification,
            doctor.dept_name,
            doctor.email,
          ]
            .join(" ")
            .toLowerCase()
            .includes(
              search
            );
        }
      );
    }, [
      doctors,
      doctorSearch,
    ]);

  const unpaidBills =
    bills.filter(
      (bill) =>
        [
          "unpaid",
          "partial",
        ].includes(
          bill.status
        )
    );

  const currentAdmissions =
    admissions.filter(
      (admission) =>
        admission.status ===
        "admitted"
    );

  const updateProfile =
    async (
      event
    ) => {
      event.preventDefault();

      const response =
        await fetch(
          `${API}/patient-dashboard/profile/${patientId}`,
          {
            method:
              "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                profileForm
              ),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setMessage(
          data.error ||
            "Profile update failed."
        );

        return;
      }

      localStorage.setItem(
        "patient",
        JSON.stringify(
          {
            ...storedPatient,
            ...data.patient,
          }
        )
      );

      setMessage(
        "Profile updated successfully."
      );

      await loadAll();
    };

  const bookAppointment =
    async (
      event
    ) => {
      event.preventDefault();

      const response =
        await fetch(
          `${API}/patient-dashboard/appointments/book`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                {
                  patient_id:
                    patientId,

                  doctor_id:
                    Number(
                      appointmentForm.doctor_id
                    ),

                  slot_id:
                    Number(
                      appointmentForm.slot_id
                    ),

                  reason:
                    appointmentForm.reason,

                  notes:
                    appointmentForm.notes,
                }
              ),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setMessage(
          data.error ||
            "Appointment booking failed."
        );

        return;
      }

      setMessage(
        "Appointment booked successfully."
      );

      setAppointmentForm({
        doctor_id: "",
        slot_id: "",
        reason: "",
        notes: "",
      });

      await loadAll();
    };

  const chooseBill = (
    bill
  ) => {
    const net =
      Number(
        bill.net_amount ||
          0
      );

    const paid =
      Number(
        bill.paid_amount ||
          0
      );

    setPaymentForm({
      bill_id:
        String(
          bill.bill_id
        ),

      amount:
        String(
          Math.max(
            net - paid,
            0
          )
        ),

      method: "cash",
      ref_no: "",
      notes: "",
    });

    setActivePage(
      "payments"
    );
  };

  const payBill =
    async (
      event
    ) => {
      event.preventDefault();

      const response =
        await fetch(
          `${API}/payments`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                {
                  bill_id:
                    Number(
                      paymentForm.bill_id
                    ),

                  patient_id:
                    patientId,

                  amount:
                    Number(
                      paymentForm.amount
                    ),

                  method:
                    paymentForm.method,

                  ref_no:
                    paymentForm.ref_no ||
                    null,

                  notes:
                    paymentForm.notes ||
                    null,
                }
              ),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setMessage(
          data.error ||
            "Payment failed."
        );

        return;
      }

      setMessage(
        "Payment successful."
      );

      setPaymentForm({
        bill_id: "",
        amount: "",
        method: "cash",
        ref_no: "",
        notes: "",
      });

      await loadAll();
    };

  const submitComplaint =
    async (
      event
    ) => {
      event.preventDefault();

      const response =
        await fetch(
          `${API}/patient-dashboard/complaints/${patientId}`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                complaintForm
              ),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setMessage(
          data.error ||
            "Complaint submission failed."
        );

        return;
      }

      setMessage(
        "Complaint submitted successfully."
      );

      setComplaintForm({
        target_type:
          "doctor",
        target_id: "",
        complaint_type:
          "",
        description: "",
      });

      await loadAll();
    };

  const submitInsurance =
    async (
      event
    ) => {
      event.preventDefault();

      const response =
        await fetch(
          `${API}/patient-dashboard/insurance/${patientId}`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                insuranceForm
              ),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setMessage(
          data.error ||
            "Insurance failed."
        );

        return;
      }

      setMessage(
        "Insurance information added."
      );

      setInsuranceForm(
        {}
      );

      await loadAll();
    };

  const logout = () => {
    localStorage.removeItem(
      "patient"
    );

    localStorage.removeItem(
      "role"
    );

    navigate(
      "/login"
    );
  };

  if (loading) {
    return (
      <div className="patient-loading">
        Loading patient dashboard...
      </div>
    );
  }

  const targetList =
    complaintForm.target_type ===
    "doctor"
      ? visibleDoctors
      : staff;

  return (
    <div className="patient-dashboard">

      <aside className="patient-sidebar">

        <h2>MediCare</h2>

        <p>
          {profile?.name ||
            patientId}
        </p>

        {[
          [
            "overview",
            "Dashboard",
          ],
          [
            "profile",
            "My Profile",
          ],
          [
            "doctors",
            "Doctors",
          ],
          [
            "book",
            "Book Appointment",
          ],
          [
            "appointments",
            "My Appointments",
          ],
          [
            "prescriptions",
            "Prescriptions",
          ],
          [
            "labtests",
            "Lab Tests",
          ],
          [
            "surgeries",
            "Surgeries",
          ],
          [
            "admissions",
            "Admissions",
          ],
          [
            "insurance",
            "Insurance",
          ],
          [
            "billing",
            "Billing",
          ],
          [
            "payments",
            "Payments",
          ],
          [
            "complaints",
            "Complaints",
          ],
        ].map(
          ([page, label]) => (
            <button
              key={page}
              onClick={() =>
                setActivePage(
                  page
                )
              }
            >
              {label}
            </button>
          )
        )}

        <button
          className="patient-logout"
          onClick={
            logout
          }
        >
          Logout
        </button>

      </aside>

      <main className="patient-main">

        {message && (
          <div className="patient-message">
            {message}
          </div>
        )}

        {activePage ===
          "overview" && (
          <>
            <h1>
              Patient Dashboard
            </h1>

            <div className="patient-summary-grid">

              <div className="patient-summary-box">
                <h3>
                  Appointments
                </h3>
                <p>
                  {
                    appointments.length
                  }
                </p>
              </div>

              <div className="patient-summary-box">
                <h3>
                  Prescriptions
                </h3>
                <p>
                  {
                    prescriptions.length
                  }
                </p>
              </div>

              <div className="patient-summary-box">
                <h3>
                  Lab Tests
                </h3>
                <p>
                  {
                    labTests.length
                  }
                </p>
              </div>

              <div className="patient-summary-box">
                <h3>
                  Surgeries
                </h3>
                <p>
                  {
                    surgeries.length
                  }
                </p>
              </div>

              <div className="patient-summary-box">
                <h3>
                  Current Admissions
                </h3>
                <p>
                  {
                    currentAdmissions.length
                  }
                </p>
              </div>

              <div className="patient-summary-box">
                <h3>
                  Unpaid Bills
                </h3>
                <p>
                  {
                    unpaidBills.length
                  }
                </p>
              </div>

            </div>
          </>
        )}

        {activePage ===
          "profile" && (
          <section className="patient-section">

            <h1>
              My Profile
            </h1>

            <form
              className="patient-form"
              onSubmit={
                updateProfile
              }
            >

              {[
                [
                  "name",
                  "Name",
                ],
                [
                  "email",
                  "Email",
                ],
                [
                  "phone",
                  "Phone",
                ],
                [
                  "blood_group",
                  "Blood Group",
                ],
                [
                  "address",
                  "Address",
                ],
              ].map(
                ([field, label]) => (
                  <div key={field}>
                    <label>
                      {label}
                    </label>

                    <input
                      value={
                        profileForm[
                          field
                        ]
                      }
                      onChange={(e) =>
                        setProfileForm({
                          ...profileForm,

                          [field]:
                            e
                              .target
                              .value,
                        })
                      }
                    />
                  </div>
                )
              )}

              <label>
                Date of Birth
              </label>

              <input
                type="date"
                value={
                  profileForm.dob
                }
                onChange={(e) =>
                  setProfileForm({
                    ...profileForm,
                    dob:
                      e.target.value,
                  })
                }
              />

              <label>
                Gender
              </label>

              <select
                value={
                  profileForm.gender
                }
                onChange={(e) =>
                  setProfileForm({
                    ...profileForm,
                    gender:
                      e.target.value,
                  })
                }
              >
                <option value="">
                  Select
                </option>
                <option value="Male">
                  Male
                </option>
                <option value="Female">
                  Female
                </option>
                <option value="Other">
                  Other
                </option>
              </select>

              <label>
                New Password
              </label>

              <input
                type="password"
                value={
                  profileForm.password
                }
                onChange={(e) =>
                  setProfileForm({
                    ...profileForm,
                    password:
                      e.target.value,
                  })
                }
              />

              <button type="submit">
                Update Profile
              </button>

            </form>

          </section>
        )}

        {activePage ===
          "doctors" && (
          <section className="patient-section">

            <h1>Doctors</h1>

            <input
              className="patient-search"
              placeholder="Search doctors"
              value={
                doctorSearch
              }
              onChange={(e) =>
                setDoctorSearch(
                  e.target.value
                )
              }
            />

            <div className="patient-table-wrapper">

              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>
                      Specialization
                    </th>
                    <th>
                      Department
                    </th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {visibleDoctors.map(
                    (doctor) => (
                      <tr
                        key={
                          doctor.doctor_id
                        }
                      >
                        <td>
                          {doctorName(
                            doctor
                          )}
                        </td>

                        <td>
                          {doctor.specialization ||
                            doctor.specification ||
                            "-"}
                        </td>

                        <td>
                          {doctor.dept_name ||
                            "-"}
                        </td>

                        <td>
                          <button
                            onClick={() => {
                              setAppointmentForm({
                                ...appointmentForm,

                                doctor_id:
                                  String(
                                    doctor.doctor_id
                                  ),

                                slot_id:
                                  "",
                              });

                              setActivePage(
                                "book"
                              );
                            }}
                          >
                            Book
                          </button>
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
          "book" && (
          <section className="patient-section">

            <h1>
              Book Appointment
            </h1>

            <form
              className="patient-form"
              onSubmit={
                bookAppointment
              }
            >

              <label>Doctor</label>

              <select
                value={
                  appointmentForm.doctor_id
                }
                onChange={(e) =>
                  setAppointmentForm({
                    ...appointmentForm,

                    doctor_id:
                      e.target.value,

                    slot_id: "",
                  })
                }
                required
              >
                <option value="">
                  Select
                </option>

                {visibleDoctors.map(
                  (doctor) => (
                    <option
                      key={
                        doctor.doctor_id
                      }
                      value={
                        doctor.doctor_id
                      }
                    >
                      {doctorName(
                        doctor
                      )}
                    </option>
                  )
                )}
              </select>

              <label>
                Available Slot
              </label>

              <select
                value={
                  appointmentForm.slot_id
                }
                onChange={(e) =>
                  setAppointmentForm({
                    ...appointmentForm,

                    slot_id:
                      e.target.value,
                  })
                }
                required
              >

                <option value="">
                  Select
                </option>

                {slots.map(
                  (slot) => (
                    <option
                      key={
                        slot.slot_id
                      }
                      value={
                        slot.slot_id
                      }
                    >
                      {dateOnly(
                        slot.slot_date
                      )}{" "}
                      {timeOnly(
                        slot.start_time
                      )}{" "}
                      -{" "}
                      {timeOnly(
                        slot.end_time
                      )}
                    </option>
                  )
                )}

              </select>

              <label>Reason</label>

              <input
                value={
                  appointmentForm.reason
                }
                onChange={(e) =>
                  setAppointmentForm({
                    ...appointmentForm,

                    reason:
                      e.target.value,
                  })
                }
                required
              />

              <label>Notes</label>

              <textarea
                value={
                  appointmentForm.notes
                }
                onChange={(e) =>
                  setAppointmentForm({
                    ...appointmentForm,

                    notes:
                      e.target.value,
                  })
                }
              />

              <button type="submit">
                Book Appointment
              </button>

            </form>

          </section>
        )}

        {activePage ===
          "appointments" && (
          <section className="patient-section">

            <h1>
              My Appointments
            </h1>

            <div className="patient-table-wrapper">

              <table>
                <thead>
                  <tr>
                    <th>Doctor</th>
                    <th>Staff</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Notes</th>
                  </tr>
                </thead>

                <tbody>
                  {appointments.map(
                    (appointment) => (
                      <tr
                        key={
                          appointment.appt_id
                        }
                      >
                        <td>
                          {appointment.doctor_name ||
                            "-"}
                        </td>
                        <td>
                          {appointment.staff_name ||
                            "Not Assigned"}
                        </td>
                        <td>
                          {dateOnly(
                            appointment.appt_date
                          )}
                        </td>
                        <td>
                          {timeOnly(
                            appointment.appt_time
                          )}
                        </td>
                        <td>
                          {appointment.reason ||
                            "-"}
                        </td>
                        <td>
                          {
                            appointment.status
                          }
                        </td>
                        <td>
                          {appointment.notes ||
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
          "prescriptions" && (
          <section className="patient-section">

            <h1>
              Prescriptions
            </h1>

            <div className="patient-table-wrapper">

              <table>
                <thead>
                  <tr>
                    <th>Doctor</th>
                    <th>Diagnosis</th>
                    <th>Advice</th>
                    <th>Note</th>
                    <th>Medicines</th>
                  </tr>
                </thead>

                <tbody>
                  {prescriptions.map(
                    (prescription) => {
                      const items =
                        prescriptionItems.filter(
                          (item) =>
                            Number(
                              item.pres_id
                            ) ===
                            Number(
                              prescription.pres_id
                            )
                        );

                      return (
                        <tr
                          key={
                            prescription.pres_id
                          }
                        >
                          <td>
                            {prescription.doctor_name ||
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

                          <td>
                            {items
                              .map(
                                (item) =>
                                  `${item.item_name || "Item"} ${item.dosage || ""}`
                              )
                              .join(
                                ", "
                              ) ||
                              "-"}
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>

            </div>

          </section>
        )}

        {activePage ===
          "labtests" && (
          <section className="patient-section">

            <h1>
              My Lab Tests
            </h1>

            <div className="patient-table-wrapper">

              <table>

                <thead>
                  <tr>
                    <th>Test</th>
                    <th>Doctor</th>
                    <th>Staff</th>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Result</th>
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
                          {test.test_name ||
                            "-"}
                        </td>

                        <td>
                          {test.doctor_name ||
                            "-"}
                        </td>

                        <td>
                          {test.staff_name ||
                            "Not Assigned"}
                        </td>

                        <td>
                          {test.type ||
                            "-"}
                        </td>

                        <td>
                          {dateOnly(
                            test.date
                          ) ||
                            "Not Scheduled"}
                        </td>

                        <td>
                          {test.unit_price
                            ? money(
                                test.unit_price
                              )
                            : "-"}
                        </td>

                        <td>
                          {
                            test.status
                          }
                        </td>

                        <td>
                          {test.status ===
                          "completed"
                            ? test.result ||
                              "-"
                            : "Pending"}
                        </td>

                      </tr>
                    )
                  )}

                  {labTests.length ===
                    0 && (
                    <tr>
                      <td colSpan="8">
                        No lab tests found.
                      </td>
                    </tr>
                  )}

                </tbody>

              </table>

            </div>

          </section>
        )}

        {activePage ===
          "surgeries" && (
          <section className="patient-section">

            <h1>
              My Surgeries
            </h1>

            <div className="patient-table-wrapper">

              <table>

                <thead>
                  <tr>
                    <th>Surgery</th>
                    <th>Doctor</th>
                    <th>Staff</th>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Status</th>
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
                          {surgery.surgery_name ||
                            "-"}
                        </td>

                        <td>
                          {surgery.doctor_name ||
                            "-"}
                        </td>

                        <td>
                          {surgery.staff_name ||
                            "Not Assigned"}
                        </td>

                        <td>
                          {surgery.type ||
                            "-"}
                        </td>

                        <td>
                          {dateOnly(
                            surgery.date
                          ) ||
                            "Not Scheduled"}
                        </td>

                        <td>
                          {
                            surgery.status
                          }
                        </td>
                      </tr>
                    )
                  )}

                  {surgeries.length ===
                    0 && (
                    <tr>
                      <td colSpan="6">
                        No surgeries found.
                      </td>
                    </tr>
                  )}

                </tbody>

              </table>

            </div>

          </section>
        )}

        {activePage ===
          "admissions" && (
          <section className="patient-section">

            <h1>
              My Admissions
            </h1>

            <div className="patient-table-wrapper">

              <table>
                <thead>
                  <tr>
                    <th>Doctor</th>
                    <th>Room</th>
                    <th>Admitted</th>
                    <th>Discharged</th>
                    <th>Charge</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {admissions.map(
                    (admission) => (
                      <tr
                        key={
                          admission.adm_id
                        }
                      >
                        <td>
                          {admission.doctor_name ||
                            "-"}
                        </td>

                        <td>
                          {admission.room_type ||
                            admission.room_id ||
                            "Not Assigned"}
                        </td>

                        <td>
                          {dateOnly(
                            admission.adm_date
                          ) ||
                            "-"}
                        </td>

                        <td>
                          {dateOnly(
                            admission.discharge_date
                          ) ||
                            "-"}
                        </td>

                        <td>
                          {money(
                            admission.charge
                          )}
                        </td>

                        <td>
                          {
                            admission.status
                          }
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
          "insurance" && (
          <section className="patient-section">

            <h1>
              Insurance
            </h1>

            <form
              className="patient-form"
              onSubmit={
                submitInsurance
              }
            >
              {insuranceSchema.map(
                (column) => (
                  <div
                    key={
                      column.column_name
                    }
                  >
                    <label>
                      {
                        column.column_name
                      }
                    </label>

                    <input
                      value={
                        insuranceForm[
                          column
                            .column_name
                        ] || ""
                      }
                      onChange={(e) =>
                        setInsuranceForm({
                          ...insuranceForm,

                          [column.column_name]:
                            e
                              .target
                              .value,
                        })
                      }
                    />
                  </div>
                )
              )}

              <button type="submit">
                Add Insurance
              </button>
            </form>

            <h2>
              My Insurance
            </h2>

            {insurance.map(
              (
                record,
                index
              ) => (
                <div
                  className="patient-record"
                  key={index}
                >
                  {Object.entries(
                    record
                  ).map(
                    ([
                      key,
                      value,
                    ]) => (
                      <p key={key}>
                        <strong>
                          {key}:
                        </strong>{" "}
                        {String(
                          value ??
                            "-"
                        )}
                      </p>
                    )
                  )}
                </div>
              )
            )}

          </section>
        )}

        {activePage ===
          "billing" && (
          <section className="patient-section">

            <h1>My Bills</h1>

            <div className="patient-table-wrapper">

              <table>
                <thead>
                  <tr>
                    <th>Bill ID</th>
                    <th>Type</th>
                    <th>Source</th>
                    <th>Net</th>
                    <th>Paid</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {bills.map(
                    (bill) => (
                      <tr
                        key={
                          bill.bill_id
                        }
                      >
                        <td>
                          {
                            bill.bill_id
                          }
                        </td>
                        <td>
                          {bill.source_type ||
                            "-"}
                        </td>
                        <td>
                          {bill.source_id ||
                            "-"}
                        </td>
                        <td>
                          {money(
                            bill.net_amount
                          )}
                        </td>
                        <td>
                          {money(
                            bill.paid_amount
                          )}
                        </td>
                        <td>
                          {
                            bill.status
                          }
                        </td>
                        <td>
                          {[
                            "unpaid",
                            "partial",
                          ].includes(
                            bill.status
                          ) ? (
                            <button
                              onClick={() =>
                                chooseBill(
                                  bill
                                )
                              }
                            >
                              Pay
                            </button>
                          ) : (
                            "-"
                          )}
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
          "payments" && (
          <>
            <section className="patient-section">

              <h1>
                Make Payment
              </h1>

              <form
                className="patient-form"
                onSubmit={
                  payBill
                }
              >

                <label>Bill</label>

                <select
                  value={
                    paymentForm.bill_id
                  }
                  onChange={(e) => {
                    const bill =
                      bills.find(
                        (item) =>
                          Number(
                            item.bill_id
                          ) ===
                          Number(
                            e.target.value
                          )
                      );

                    if (bill) {
                      chooseBill(
                        bill
                      );
                    }
                  }}
                >
                  <option value="">
                    Select Bill
                  </option>

                  {unpaidBills.map(
                    (bill) => (
                      <option
                        key={
                          bill.bill_id
                        }
                        value={
                          bill.bill_id
                        }
                      >
                        Bill #
                        {
                          bill.bill_id
                        }{" "}
                        -{" "}
                        {
                          bill.source_type
                        }
                      </option>
                    )
                  )}
                </select>

                <label>Amount</label>

                <input
                  type="number"
                  value={
                    paymentForm.amount
                  }
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,

                      amount:
                        e.target.value,
                    })
                  }
                />

                <label>Method</label>

                <select
                  value={
                    paymentForm.method
                  }
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,

                      method:
                        e.target.value,
                    })
                  }
                >
                  <option value="cash">
                    Cash
                  </option>
                  <option value="card">
                    Card
                  </option>
                  <option value="mobile_banking">
                    Mobile Banking
                  </option>
                  <option value="bank_transfer">
                    Bank Transfer
                  </option>
                </select>

                <label>
                  Reference No
                </label>

                <input
                  value={
                    paymentForm.ref_no
                  }
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,

                      ref_no:
                        e.target.value,
                    })
                  }
                />

                <button type="submit">
                  Pay Now
                </button>

              </form>

            </section>

            <section className="patient-section">

              <h2>
                Payment History
              </h2>

              <div className="patient-table-wrapper">

                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Bill</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Date</th>
                      <th>Method</th>
                    </tr>
                  </thead>

                  <tbody>
                    {payments.map(
                      (payment) => (
                        <tr
                          key={
                            payment.payment_id
                          }
                        >
                          <td>
                            {
                              payment.payment_id
                            }
                          </td>
                          <td>
                            {
                              payment.bill_id
                            }
                          </td>
                          <td>
                            {payment.source_type ||
                              "-"}
                          </td>
                          <td>
                            {money(
                              payment.amount
                            )}
                          </td>
                          <td>
                            {dateOnly(
                              payment.payment_date
                            )}
                          </td>
                          <td>
                            {payment.method ||
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
          "complaints" && (
          <section className="patient-section">

            <h1>
              Submit Complaint
            </h1>

            <form
              className="patient-form"
              onSubmit={
                submitComplaint
              }
            >

              <label>
                Against
              </label>

              <select
                value={
                  complaintForm.target_type
                }
                onChange={(e) =>
                  setComplaintForm({
                    ...complaintForm,

                    target_type:
                      e.target.value,

                    target_id: "",
                  })
                }
              >
                <option value="doctor">
                  Doctor
                </option>
                <option value="staff">
                  Staff
                </option>
              </select>

              <label>
                Select Person
              </label>

              <select
                value={
                  complaintForm.target_id
                }
                onChange={(e) =>
                  setComplaintForm({
                    ...complaintForm,

                    target_id:
                      e.target.value,
                  })
                }
              >
                <option value="">
                  Select
                </option>

                {targetList.map(
                  (person) => (
                    <option
                      key={
                        complaintForm.target_type ===
                        "doctor"
                          ? person.doctor_id
                          : person.staff_id
                      }
                      value={
                        complaintForm.target_type ===
                        "doctor"
                          ? person.doctor_id
                          : person.staff_id
                      }
                    >
                      {complaintForm.target_type ===
                      "doctor"
                        ? doctorName(
                            person
                          )
                        : person.name}
                    </option>
                  )
                )}
              </select>

              <label>Type</label>

              <input
                value={
                  complaintForm.complaint_type
                }
                onChange={(e) =>
                  setComplaintForm({
                    ...complaintForm,

                    complaint_type:
                      e.target.value,
                  })
                }
              />

              <label>
                Description
              </label>

              <textarea
                value={
                  complaintForm.description
                }
                onChange={(e) =>
                  setComplaintForm({
                    ...complaintForm,

                    description:
                      e.target.value,
                  })
                }
              />

              <button type="submit">
                Submit Complaint
              </button>

            </form>

          </section>
        )}

      </main>
    </div>
  );
}

export default PatientDashboard;