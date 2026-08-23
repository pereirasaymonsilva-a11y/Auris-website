import { Resend } from "resend";

export default async function handler(req, res) {
    // CORS
    res.setHeader(
        "Access-Control-Allow-Origin",
        "*"
    );

    res.setHeader(
        "Access-Control-Allow-Methods",
        "POST, OPTIONS"
    );

    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type"
    );

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            message: "Método não permitido."
        });
    }

    try {
        const {
            name,
            email,
            category,
            custom_subject,
            app_version,
            android_version,
            device,
            message,
            protocol
        } = req.body || {};

        // Validação básica
        if (
            !name ||
            !email ||
            !category ||
            !message
        ) {
            return res.status(400).json({
                success: false,
                message: "Preencha todos os campos obrigatórios."
            });
        }

        const resend = new Resend(
            process.env.RESEND_API_KEY
        );

        let subject = category;

        if (
            category === "Outro" &&
            custom_subject &&
            custom_subject.trim()
        ) {
            subject = custom_subject.trim();
        }

        subject =
            `[${subject}] ${protocol || "AUR-XXXXX"} — Suporte Auris`;

        const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
</head>

<body style="
    margin:0;
    padding:30px 15px;
    background:#030308;
    font-family:Arial,Helvetica,sans-serif;
    color:#f0f4ff;
">

    <div style="
        max-width:650px;
        margin:auto;
        background:#111522;
        border:1px solid rgba(255,255,255,.08);
        border-radius:20px;
        overflow:hidden;
    ">

        <div style="
            padding:25px;
            background:linear-gradient(105deg,#00e0ff,#0077ff);
        ">

            <h1 style="
                margin:0;
                color:white;
                font-size:22px;
            ">
                Auris · Suporte
            </h1>

            <p style="
                margin:7px 0 0;
                color:rgba(255,255,255,.85);
                font-size:14px;
            ">
                Nova solicitação de suporte
            </p>

        </div>

        <div style="padding:25px;">

            <div style="
                margin-bottom:20px;
                padding:14px;
                background:#0b0f19;
                border-radius:12px;
                border:1px solid rgba(255,255,255,.06);
            ">

                <strong style="color:#00e0ff;">
                    Protocolo
                </strong>

                <div style="
                    margin-top:5px;
                    font-size:16px;
                    font-weight:bold;
                ">
                    ${escapeHtml(protocol || "AUR-XXXXX")}
                </div>

            </div>

            <h2 style="
                font-size:16px;
                margin:0 0 15px;
            ">
                Informações do contato
            </h2>

            ${infoRow("Nome", name)}
            ${infoRow("E-mail", email)}
            ${infoRow("Categoria", category)}
            ${infoRow("Versão do Auris", app_version || "Não informado")}
            ${infoRow("Versão do Android", android_version || "Não informado")}
            ${infoRow("Dispositivo", device || "Não informado")}

            <h2 style="
                font-size:16px;
                margin:25px 0 10px;
            ">
                Mensagem
            </h2>

            <div style="
                padding:15px;
                background:#0b0f19;
                border-radius:12px;
                border:1px solid rgba(255,255,255,.06);
                white-space:pre-wrap;
                line-height:1.6;
                color:#dce5f7;
            ">
                ${escapeHtml(message)}
            </div>

        </div>

        <div style="
            padding:18px 25px;
            background:#0b0f19;
            color:#657796;
            font-size:12px;
        ">
            Enviado através da Central de Suporte do Auris Music Player.
        </div>

    </div>

</body>
</html>
        `;

        const { data, error } =
            await resend.emails.send({
                from:
                    "Auris Suporte <onboarding@resend.dev>",

                to:
                    ["aurismusicplayer@gmail.com"],

                replyTo:
                    email,

                subject,

                html
            });

        if (error) {
            console.error(
                "Erro Resend:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "O serviço de e-mail recusou o envio."
            });
        }

        return res.status(200).json({
            success: true,
            protocol,
            id: data?.id || null
        });

    } catch (error) {

        console.error(
            "Erro interno:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Erro interno ao enviar a mensagem."
        });
    }
}


// ===============================
// FUNÇÕES AUXILIARES
// ===============================

function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function infoRow(label, value) {

    return `
        <div style="
            margin-bottom:10px;
            padding-bottom:10px;
            border-bottom:1px solid rgba(255,255,255,.05);
        ">

            <div style="
                color:#7185a7;
                font-size:11px;
                margin-bottom:3px;
            ">
                ${escapeHtml(label)}
            </div>

            <div style="
                color:#dce5f7;
                font-size:14px;
            ">
                ${escapeHtml(value)}
            </div>

        </div>
    `;
}