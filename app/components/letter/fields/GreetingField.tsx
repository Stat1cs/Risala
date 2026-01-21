/**
 * Greeting field component
 */

interface GreetingFieldProps {
  show?: boolean;
}

export function GreetingField({ show = true }: GreetingFieldProps) {
  if (!show) return null;

  return (
    <div
      className="text-gray-900 dark:text-white"
      style={{
        textAlign: "right",
        marginBottom: "1.5rem",
        fontSize: "14pt",
        fontWeight: 400,
      }}
    >
      السلام عليـــكم ورحمة الله وبركاته... تحية طيبة وبعد،،،
    </div>
  );
}
