"use client";

import { useEffect, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { motion } from "framer-motion";
import QRCode from "qrcode";
import {
  Building2,
  CalendarClock,
  CheckCircle2,
  Copy,
  Download,
  Loader2,
  Mail,
  Phone,
  School,
  Smartphone,
  Users,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { fadeUp, scaleIn, staggerContainer } from "@/lib/subscribe/motion";
import { PaymentMethod } from "@/components/subscribe/PaymentMethod";
import { PrimaryButton } from "@/components/subscribe/PrimaryButton";
import { PoweredByPawapay } from "@/components/subscribe/PoweredByPawapay";
import {
  getCongoPhoneProviderError,
  isValidCongoPhone,
  maskPhone,
} from "@/components/subscribe/PhoneInput";
import type { PaymentProvider } from "@/lib/subscribe/plans";
import {
  fetchOffresPubliques,
  fetchStatutPaiementEtablissement,
  payerEtablissement,
  type OffreEtablissement,
} from "@/lib/pack-etablissement/api";

type Phase = "loading" | "form" | "processing" | "waiting" | "success" | "error";

function formatXaf(n: number, devise: string): string {
  return `${new Intl.NumberFormat("fr-FR").format(n)} ${devise}`;
}

/** Petit badge numéroté — encode l'ordre réel des étapes du formulaire (1 → 3). */
function SectionHeading({ n, children }: { n: number; children: ReactNode }) {
  return (
    <h2 className="mb-3 flex items-center gap-2.5 text-base font-semibold text-zinc-800">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#004AC6] text-xs font-bold text-white">
        {n}
      </span>
      {children}
    </h2>
  );
}

type IconFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  icon: LucideIcon;
  label: string;
  error?: string;
};

/** Champ « rempli tonal » : fond teinté bleu, label fixe en haut, trait d'accent en bas qui s'allume au focus. */
function IconField({ icon: Icon, label, id, className, error, ...inputProps }: IconFieldProps) {
  const fieldId = id ?? `champ-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <div>
      <div
        className={cn(
          "group relative h-14 rounded-t-xl rounded-b-md bg-[#004AC6]/[0.05] transition-colors focus-within:bg-[#004AC6]/[0.09]",
          error && "bg-red-500/[0.05] focus-within:bg-red-500/[0.08]"
        )}
      >
        <Icon
          className={cn(
            "pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-[#004AC6]",
            error && "text-red-400 group-focus-within:text-red-500"
          )}
        />
        <label
          htmlFor={fieldId}
          className="absolute left-11 top-[7px] text-[10.5px] font-semibold uppercase tracking-wide text-zinc-400"
        >
          {label}
        </label>
        <input
          id={fieldId}
          {...inputProps}
          className={cn(
            "absolute bottom-[7px] left-11 right-3.5 bg-transparent text-[15px] text-zinc-900 outline-none placeholder:text-zinc-400",
            className
          )}
        />
        <span
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 h-[2px] rounded-b-md bg-zinc-300 transition-colors group-focus-within:bg-[#004AC6]",
            error && "bg-red-400 group-focus-within:bg-red-500"
          )}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Flux d'achat en ligne d'un pack établissement — embarqué comme onglet de /subscribe. */
export function EtablissementPurchaseFlow() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [offres, setOffres] = useState<OffreEtablissement[]>([]);
  const [offreId, setOffreId] = useState<string | null>(null);
  const [offresError, setOffresError] = useState(false);

  const [nomEtablissement, setNomEtablissement] = useState("");
  const [emailContact, setEmailContact] = useState("");
  const [telephoneContact, setTelephoneContact] = useState("");
  const [nomTouched, setNomTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [provider, setProvider] = useState<PaymentProvider | null>(null);
  const [phone, setPhone] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [ref, setRef] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(120);
  const [code, setCode] = useState<string | null>(null);
  const [etablissementNom, setEtablissementNom] = useState<string | null>(null);
  const [dateFin, setDateFin] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [downloadingReceipt, setDownloadingReceipt] = useState(false);

  const loadOffres = () => {
    setPhase("loading");
    setOffresError(false);
    fetchOffresPubliques().then((data) => {
      setOffres(data);
      setOffreId(data[0]?.id ?? null);
      if (data.length === 0) setOffresError(true);
      setPhase("form");
    });
  };

  useEffect(() => {
    let cancelled = false;
    fetchOffresPubliques().then((data) => {
      if (cancelled) return;
      setOffres(data);
      setOffreId(data[0]?.id ?? null);
      if (data.length === 0) setOffresError(true);
      setPhase("form");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (phase !== "waiting") return;
    const timer = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "waiting" || countdown > 0) return;
    setError("Délai dépassé. Si le paiement a bien été effectué, contactez le support avec votre référence.");
    setPhase("error");
  }, [phase, countdown]);

  useEffect(() => {
    if (phase !== "waiting" || !ref) return;
    const poll = setInterval(async () => {
      const status = await fetchStatutPaiementEtablissement(ref);
      if (!status) return;
      if (status.statut === "SUCCES" && status.etablissement) {
        clearInterval(poll);
        setCode(status.etablissement.code_invitation);
        setEtablissementNom(status.etablissement.nom);
        setDateFin(status.etablissement.date_fin);
        setPhase("success");
      } else if (status.statut === "ECHEC") {
        clearInterval(poll);
        setError("Paiement refusé ou annulé.");
        setPhase("error");
      }
    }, 3000);
    return () => clearInterval(poll);
  }, [phase, ref]);

  const selectedOffre = offres.find((o) => o.id === offreId) ?? null;

  const nomError =
    nomTouched && nomEtablissement.trim().length < 2
      ? "Le nom doit contenir au moins 2 caractères."
      : undefined;
  const emailError =
    emailTouched && !/\S+@\S+\.\S+/.test(emailContact)
      ? "Adresse e-mail invalide."
      : undefined;

  const canSubmit =
    selectedOffre &&
    nomEtablissement.trim().length >= 2 &&
    /\S+@\S+\.\S+/.test(emailContact) &&
    provider &&
    isValidCongoPhone(phone, provider);

  const handlePayer = async () => {
    if (!selectedOffre || !provider) return;
    setNomTouched(true);
    setEmailTouched(true);
    if (!isValidCongoPhone(phone, provider)) {
      setError(getCongoPhoneProviderError(phone, provider) ?? "Numéro invalide.");
      return;
    }
    setError(null);
    setPhase("processing");

    const result = await payerEtablissement({
      offre_id: selectedOffre.id,
      nom_etablissement: nomEtablissement.trim(),
      email_contact: emailContact.trim(),
      telephone_contact: telephoneContact.trim() || undefined,
      operator: provider,
      phonenumber: `242${phone.replace(/\D/g, "")}`,
      country: "CG",
    });

    if (!result.ok) {
      setError(result.error);
      setPhase("form");
      return;
    }

    setRef(result.data.ref_transaction);
    setCountdown(120);
    setPhase("waiting");
  };

  const cancelWaiting = () => {
    setRef(null);
    setError(null);
    setPhase("form");
  };

  const copyCode = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const downloadReceipt = async () => {
    if (!code) return;
    setDownloadingReceipt(true);
    try {
      const qrDataUrl = await QRCode.toDataURL(code, {
        margin: 1,
        width: 320,
        color: { dark: "#004AC6", light: "#FFFFFF" },
      });

      const qrImg = new Image();
      await new Promise<void>((resolve, reject) => {
        qrImg.onload = () => resolve();
        qrImg.onerror = () => reject(new Error("QR load failed"));
        qrImg.src = qrDataUrl;
      });

      const W = 640;
      const H = 860;
      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Fond
      ctx.fillStyle = "#FAFAF8";
      ctx.fillRect(0, 0, W, H);

      // Bandeau supérieur dégradé
      const grad = ctx.createLinearGradient(0, 0, W, 0);
      grad.addColorStop(0, "#004AC6");
      grad.addColorStop(1, "#1f6cf0");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, 140);

      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.font = "bold 32px Arial, sans-serif";
      ctx.fillText("B LINKS", W / 2, 65);
      ctx.font = "600 16px Arial, sans-serif";
      ctx.fillText("Pack établissement activé", W / 2, 98);

      // Carte blanche
      const cardX = 40;
      const cardY = 180;
      const cardW = W - 80;
      const cardH = H - 260;
      ctx.fillStyle = "#FFFFFF";
      roundRect(ctx, cardX, cardY, cardW, cardH, 24);
      ctx.fill();
      ctx.strokeStyle = "#E4E4E7";
      ctx.lineWidth = 1;
      roundRect(ctx, cardX, cardY, cardW, cardH, 24);
      ctx.stroke();

      // Nom établissement
      ctx.fillStyle = "#18181B";
      ctx.font = "bold 24px Arial, sans-serif";
      ctx.fillText(etablissementNom ?? "Établissement", W / 2, cardY + 50);

      // QR code
      const qrSize = 240;
      ctx.drawImage(qrImg, W / 2 - qrSize / 2, cardY + 80, qrSize, qrSize);

      // Code
      ctx.fillStyle = "#004AC6";
      ctx.font = "bold 34px 'Courier New', monospace";
      ctx.fillText(code, W / 2, cardY + 80 + qrSize + 55);

      // Validité
      if (dateFin) {
        ctx.fillStyle = "#71717A";
        ctx.font = "14px Arial, sans-serif";
        const dateLabel = `Valable jusqu'au ${new Date(dateFin).toLocaleDateString("fr-FR", { dateStyle: "long" })}`;
        ctx.fillText(dateLabel, W / 2, cardY + 80 + qrSize + 88);
      }

      // Pied de page
      ctx.fillStyle = "#A1A1AA";
      ctx.font = "12px Arial, sans-serif";
      ctx.fillText(
        "Scannez ou saisissez ce code dans l'application B LINKS pour rejoindre le pack.",
        W / 2,
        H - 30
      );

      const pngUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = pngUrl;
      a.download = `blinks-code-${code}.png`;
      a.click();
    } finally {
      setDownloadingReceipt(false);
    }
  };

  if (phase === "loading") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#004AC6]" />
      </div>
    );
  }

  if (phase === "processing") {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={scaleIn}
        className="mx-auto max-w-md py-6"
      >
        <div className="rounded-3xl bg-white p-8 text-center shadow-lg">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-[#004AC6]" />
          <h2 className="mt-4 text-lg font-semibold text-zinc-800">
            Initialisation du paiement…
          </h2>
        </div>
      </motion.div>
    );
  }

  if (phase === "waiting") {
    const progress = ((120 - countdown) / 120) * 100;
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={scaleIn}
        className="mx-auto max-w-md py-6"
      >
        <div className="rounded-3xl bg-white p-8 text-center shadow-lg">
          <div className="mx-auto flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-amber-400/15">
            <Smartphone className="h-8 w-8 text-amber-500" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-zinc-900">
            Confirmez sur votre téléphone
          </h2>
          <p className="mt-2 text-sm text-zinc-500">Envoyé au {maskPhone(phone)}</p>

          <div className="relative mx-auto mt-6 h-20 w-20">
            <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" stroke="#E4E4E7" strokeWidth="6" fill="none" />
              <circle
                cx="40"
                cy="40"
                r="34"
                stroke={countdown < 30 ? "#EF4444" : countdown < 60 ? "#F59E0B" : "#004AC6"}
                strokeWidth="6"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 34}`}
                strokeDashoffset={`${2 * Math.PI * 34 * (1 - progress / 100)}`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-zinc-800">
              {countdown}
            </span>
          </div>

          <div className="mt-6 rounded-2xl border border-zinc-100 bg-zinc-50 p-4 text-left text-sm text-zinc-600">
            <p>1. Ouvrez votre app {provider === "AIRTEL" ? "Airtel Money" : "MTN MoMo"}</p>
            <p className="mt-2">2. Acceptez la demande de paiement</p>
            <p className="mt-2">3. Votre pack sera créé automatiquement</p>
          </div>

          <button
            type="button"
            onClick={cancelWaiting}
            className="mt-6 text-xs text-zinc-400 underline"
          >
            Annuler
          </button>
        </div>
      </motion.div>
    );
  }

  if (phase === "success") {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={scaleIn}
        className="mx-auto max-w-md py-6"
      >
        <div className="rounded-3xl bg-white p-8 text-center shadow-lg">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-9 w-9 text-emerald-600" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-zinc-900">
            Pack activé pour {etablissementNom}
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            Partagez ce code avec vos élèves pour qu&apos;ils rejoignent le pack
            depuis l&apos;application.
          </p>

          <div className="mt-6 flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#004AC6]/30 bg-[#004AC6]/5 px-6 py-4">
            <span className="font-mono text-2xl font-bold tracking-wider text-[#004AC6]">
              {code}
            </span>
            <button
              type="button"
              onClick={copyCode}
              className="rounded-lg p-2 text-[#004AC6] hover:bg-[#004AC6]/10"
              title="Copier"
            >
              <Copy className="h-5 w-5" />
            </button>
          </div>
          {copied && <p className="mt-2 text-xs text-emerald-600">Code copié !</p>}

          {dateFin && (
            <p className="mt-4 text-xs text-zinc-400">
              Valable jusqu&apos;au{" "}
              {new Date(dateFin).toLocaleDateString("fr-FR", {
                dateStyle: "long",
              })}
            </p>
          )}

          <p className="mt-2 text-xs font-medium text-amber-600">
            Ce code ne sera plus affiché après avoir quitté cette page : téléchargez-le.
          </p>

          <button
            type="button"
            onClick={() => void downloadReceipt()}
            disabled={downloadingReceipt}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border-[1.5px] border-[#004AC6] px-5 py-3 text-sm font-semibold text-[#004AC6] transition hover:bg-[#004AC6]/5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {downloadingReceipt ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {downloadingReceipt ? "Génération…" : "Télécharger le reçu (avec QR code)"}
          </button>
        </div>
      </motion.div>
    );
  }

  if (phase === "error") {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={scaleIn}
        className="mx-auto max-w-md py-6"
      >
        <div className="rounded-3xl bg-white p-8 text-center shadow-lg">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-9 w-9 text-red-600" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-zinc-900">
            Paiement non confirmé
          </h2>
          <p className="mt-2 text-sm text-zinc-500">{error}</p>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setPhase("form");
            }}
            className="mt-6 text-sm font-semibold text-[#004AC6] underline"
          >
            Réessayer
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="pb-8"
    >
      <motion.div variants={fadeUp} className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#004AC6] to-[#1f6cf0] text-white shadow-[0_8px_24px_rgba(0,74,198,0.30)]">
          <School className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
          Pack établissement
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Un abonnement collectif pour toute votre école, à prix fixe.
        </p>
      </motion.div>

      {offres.length === 0 ? (
        <motion.div variants={fadeUp} className="mt-8 text-center text-sm text-zinc-500">
          <p>
            {offresError
              ? "Impossible de charger les offres pour le moment."
              : "Aucune offre disponible pour le moment. Contactez-nous directement."}
          </p>
          {offresError && (
            <button
              type="button"
              onClick={loadOffres}
              className="mt-2 font-semibold text-[#004AC6] underline"
            >
              Réessayer
            </button>
          )}
        </motion.div>
      ) : (
        <>
          <motion.section variants={fadeUp} className="mt-8">
            <SectionHeading n={1}>Choisissez une offre</SectionHeading>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {offres.map((o) => {
                const selected = offreId === o.id;
                return (
                  <motion.button
                    key={o.id}
                    type="button"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setOffreId(o.id)}
                    className={cn(
                      "flex items-start gap-3 rounded-2xl border-[1.5px] p-4 text-left transition-shadow duration-150",
                      selected
                        ? "border-[#004AC6] bg-[#004AC6]/[0.03] shadow-[0_4px_16px_rgba(0,74,198,0.12)]"
                        : "border-zinc-200 bg-white hover:shadow-[0_4px_16px_rgba(0,0,0,0.05)]"
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-[1.5px]",
                        selected ? "border-[#004AC6] bg-[#004AC6]" : "border-zinc-300"
                      )}
                    >
                      {selected && <span className="h-2 w-2 rounded-full bg-white" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-zinc-800">{o.nom}</p>
                      <p className="mt-1 text-2xl font-bold text-[#004AC6]">
                        {formatXaf(o.prix, o.devise)}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          Jusqu&apos;à {o.nb_users_max} élèves
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <CalendarClock className="h-3.5 w-3.5" />
                          {o.duree_jours} jours
                        </span>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.section>

          <motion.section variants={fadeUp} className="mt-8">
            <SectionHeading n={2}>Coordonnées de l&apos;établissement</SectionHeading>
            <div className="space-y-3">
              <IconField
                icon={Building2}
                label="Nom de l'établissement"
                type="text"
                value={nomEtablissement}
                onChange={(e) => setNomEtablissement(e.target.value)}
                onBlur={() => setNomTouched(true)}
                placeholder="Ex. Lycée Savorgnan de Brazza"
                error={nomError}
              />
              <IconField
                icon={Mail}
                label="E-mail de contact"
                type="email"
                value={emailContact}
                onChange={(e) => setEmailContact(e.target.value)}
                onBlur={() => setEmailTouched(true)}
                placeholder="contact@ecole.cg"
                error={emailError}
              />
              <IconField
                icon={Phone}
                label="Téléphone de contact (optionnel)"
                type="text"
                value={telephoneContact}
                onChange={(e) => setTelephoneContact(e.target.value)}
                placeholder="06 XX XX XX XX"
              />
            </div>
          </motion.section>

          <motion.section variants={fadeUp} className="mt-8">
            <SectionHeading n={3}>Mode de paiement</SectionHeading>
            <div className="space-y-3">
              <PaymentMethod
                provider="MTN"
                label="MTN Mobile Money"
                logoClass="bg-[#FFCB00] text-black"
                logoText="MoMo"
                selected={provider === "MTN"}
                expanded={provider === "MTN"}
                phone={phone}
                onSelect={() => setProvider("MTN")}
                onPhoneChange={setPhone}
                accent="blue"
              />
              <PaymentMethod
                provider="AIRTEL"
                label="Airtel Money"
                logoClass="bg-[#E40000] text-white italic"
                logoText="air"
                selected={provider === "AIRTEL"}
                expanded={provider === "AIRTEL"}
                phone={phone}
                onSelect={() => setProvider("AIRTEL")}
                onPhoneChange={setPhone}
                accent="blue"
              />
            </div>

            {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

            <div className="mt-6">
              <PrimaryButton
                disabled={!canSubmit}
                onClick={handlePayer}
                className="bg-gradient-to-br from-[#004AC6] to-[#1f6cf0] shadow-[0_4px_16px_rgba(0,74,198,0.35)] hover:shadow-[0_8px_24px_rgba(0,74,198,0.45)]"
              >
                Payer {selectedOffre ? formatXaf(selectedOffre.prix, selectedOffre.devise) : ""}
              </PrimaryButton>
            </div>

            <div className="mt-4">
              <PoweredByPawapay size="xs" />
            </div>
          </motion.section>
        </>
      )}
    </motion.div>
  );
}
