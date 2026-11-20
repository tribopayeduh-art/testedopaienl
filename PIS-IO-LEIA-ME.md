> Versão atual: leia primeiro ADMIN-TEMPO-REAL.md. Pacote: inex-admin-realtime-local.zip.

# PIS IO

Cada afiliado possui um código próprio de seis dígitos. O destinatário é conferido antes do envio. Débito, crédito e comprovante usam uma transação no Supabase; solicitações repetidas usam a mesma referência para evitar débito duplicado. Saldo insuficiente, autoenvio e contas bloqueadas são recusados.

O servidor usa o mesmo Supabase das carteiras, com chave privada no .env.local e acesso público bloqueado no banco. Consulte SUPABASE-ATIVACAO.md.
