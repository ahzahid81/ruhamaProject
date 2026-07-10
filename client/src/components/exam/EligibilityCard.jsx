import {
  CheckCircle,
  XCircle,
  Printer,
} from "lucide-react";

const EligibilityCard = ({
  eligibility,
  loading,
  onGenerate,
}) => {

  if (loading) {
    return (
      <div className="bg-white rounded-3xl shadow-lg p-8 mt-6">
        <div className="animate-pulse">

          <div className="h-6 bg-gray-200 rounded w-60 mb-6"></div>

          <div className="space-y-4">

            <div className="h-16 bg-gray-100 rounded-2xl"></div>

            <div className="h-16 bg-gray-100 rounded-2xl"></div>

            <div className="h-16 bg-gray-100 rounded-2xl"></div>

          </div>

        </div>
      </div>
    );
  }

  if (!eligibility) return null;

  const student = eligibility.student;

  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden mt-6">

      {/* HEADER */}

      <div className="bg-gradient-to-r from-emerald-600 to-teal-500 text-white p-6">

        <div className="flex items-center gap-5">

          {student.photo ? (
            <img
              src={student.photo}
              alt={student.name}
              className="w-24 h-24 rounded-full object-cover border-4 border-white"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center text-4xl">
              👤
            </div>
          )}

          <div>

            <h2 className="text-3xl font-bold">

              {student.name}

            </h2>

            <p className="mt-2">

              {student.studentId}

            </p>

            <p>

              {student.className}

              {" • "}

              {student.section}

              {" • Roll "}

              {student.roll}

            </p>

          </div>

        </div>

      </div>

      {/* BODY */}

      <div className="p-6">

        <h3 className="font-bold text-xl mb-5">

          Admit Card Eligibility

        </h3>

        <div className="space-y-4">

          <StatusItem

            ok={eligibility.eligible}

            title="Overall Eligibility"

            success="Eligible"

            failed="Not Eligible"

          />

          {eligibility.reasons.length === 0 ? (

            <StatusItem

              ok={true}

              title="Fee Status"

              success="All Required Fees Paid"

              failed=""

            />

          ) : (

            eligibility.reasons.map(

              (reason, index) => (

                <StatusItem

                  key={index}

                  ok={false}

                  title="Pending"

                  success=""

                  failed={reason}

                />

              )

            )

          )}

        </div>

        <div className="mt-8">

          {eligibility.eligible ? (

            <button

              onClick={onGenerate}

              className="
              bg-emerald-600
              hover:bg-emerald-700
              transition
              text-white
              font-bold
              px-8
              py-4
              rounded-2xl
              flex
              items-center
              gap-3
              "

            >

              <Printer size={22} />

              Generate Admit Card

            </button>

          ) : (

            <button

              disabled

              className="
              bg-red-500
              text-white
              font-bold
              px-8
              py-4
              rounded-2xl
              opacity-70
              cursor-not-allowed
              "

            >

              Cannot Generate Admit Card

            </button>

          )}

        </div>

      </div>

    </div>
  );
};

const StatusItem = ({
  ok,
  title,
  success,
  failed,
}) => {

  return (

    <div
      className={`
      rounded-2xl
      p-5
      border
      ${
        ok
          ? "border-green-200 bg-green-50"
          : "border-red-200 bg-red-50"
      }
      `}
    >

      <div className="flex items-center gap-4">

        {ok ? (

          <CheckCircle
            size={28}
            className="text-green-600"
          />

        ) : (

          <XCircle
            size={28}
            className="text-red-600"
          />

        )}

        <div>

          <h4 className="font-bold">

            {title}

          </h4>

          <p
            className={
              ok
                ? "text-green-700"
                : "text-red-700"
            }
          >

            {ok ? success : failed}

          </p>

        </div>

      </div>

    </div>

  );

};

export default EligibilityCard;