import type { ComponentProps } from "react";
import { Link } from "react-router-dom";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg";

interface ButtonStyle {
  variant?: Variant;
  size?: Size;
  className?: string;
}

const VARIANT: Record<Variant, string> = {
  primary: "bg-violet text-ink hover:brightness-115",
  secondary: "bg-ink/10 text-ink hover:bg-ink/20",
  ghost: "text-accent-soft hover:text-ink",
};

const SIZE: Record<Size, string> = {
  md: "h-11 px-5 text-sm",
  lg: "h-14 px-7 text-base",
};

function buttonClasses({ variant = "primary", size = "md", className = "" }: ButtonStyle) {
  return [
    "inline-flex items-center justify-center gap-2 font-semibold",
    "transition-[transform,background-color,color,filter] duration-150 ease-out-strong",
    "active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50",
    VARIANT[variant],
    variant === "ghost" ? "" : SIZE[size],
    className,
  ].join(" ");
}

type ButtonProps = ButtonStyle & Omit<ComponentProps<"button">, "className">;

export default function Button({ variant, size, className, type = "button", ...rest }: ButtonProps) {
  return <button type={type} className={buttonClasses({ variant, size, className })} {...rest} />;
}

type ButtonLinkProps = ButtonStyle & Omit<ComponentProps<typeof Link>, "className">;

export function ButtonLink({ variant, size, className, ...rest }: ButtonLinkProps) {
  return <Link className={buttonClasses({ variant, size, className })} {...rest} />;
}

type ButtonAnchorProps = ButtonStyle & Omit<ComponentProps<"a">, "className">;

export function ButtonAnchor({ variant, size, className, ...rest }: ButtonAnchorProps) {
  return <a className={buttonClasses({ variant, size, className })} {...rest} />;
}