import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-5xl" aria-hidden="true">🏡</p>
      <h1 className="text-xl font-bold">الصفحة دي مش موجودة</h1>
      <p className="text-sm leading-6 text-ink-soft">
        يمكن الرابط قديم أو فيه غلطة. تعالي نرجع للصفحة الرئيسية.
      </p>
      <Link href="/" className="btn-primary">
        رجوع للرئيسية
      </Link>
    </div>
  );
}
