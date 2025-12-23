import type { FC } from "react";

type FormSubmitMessageProps = {
  type: "success" | "error";
  message: string;
};

export const FormSubmitMessage: FC<FormSubmitMessageProps> = ({
  type,
  message,
}) => {
  const isSuccess = type === "success";
  const borderColor = isSuccess ? "border-emerald-500/50" : "border-red-500/50";
  const bgColor = isSuccess ? "bg-emerald-500/10" : "bg-red-500/10";
  const textColor = isSuccess ? "text-emerald-200" : "text-red-200";

  return (
    <div
      className={`rounded-lg border ${borderColor} ${bgColor} px-4 py-3 text-sm ${textColor}`}
    >
      {message}
    </div>
  );
};
