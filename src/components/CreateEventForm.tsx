"use client";

import { useActionState } from "react";
import { createEvent, type FormState } from "@/app/actions";
import { addDays, toDateStr } from "@/lib/time";
import { EventFields } from "./EventFields";

export function CreateEventForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(
    createEvent,
    {},
  );
  const today = toDateStr(new Date());
  const values = state.values ?? {
    startDate: today,
    endDate: addDays(today, 6),
  };

  return (
    <form action={action} className="card flex flex-col gap-6 p-5 sm:p-6">
      <EventFields values={values} errors={state.errors} />
      {state.errors?._ && (
        <p className="text-sm text-danger">{state.errors._}</p>
      )}
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "作成中…" : "共有URLをつくる"}
      </button>
    </form>
  );
}
