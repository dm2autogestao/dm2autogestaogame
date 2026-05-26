export function maskCnpj(value?: string) {
  const digits = (value ?? "").replace(/\D/g, "");

  if (digits.length !== 14) {
    return "CNPJ protegido";
  }

  return `${digits.slice(0, 2)}.***.***/****-${digits.slice(12)}`;
}

export function maskEmail(value?: string) {
  const [name, domain] = (value ?? "").split("@");

  if (!name || !domain) {
    return "e-mail protegido";
  }

  const visible = name.slice(0, Math.min(2, name.length));
  return `${visible}${"*".repeat(Math.max(3, name.length - visible.length))}@${domain}`;
}

export function maskPhone(value?: string) {
  const digits = (value ?? "").replace(/\D/g, "");

  if (digits.length < 4) {
    return "telefone protegido";
  }

  return `****-${digits.slice(-4)}`;
}
