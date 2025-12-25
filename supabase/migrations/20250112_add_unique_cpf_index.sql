-- Replace unique cpf index with composite (cpf, modalidade)

drop index if exists public.inscricoes_cpf_unique;
create unique index if not exists inscricoes_cpf_modalidade_unique on public.inscricoes (cpf, modalidade);