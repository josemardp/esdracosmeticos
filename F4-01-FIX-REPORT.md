# Diagnóstico e Correção - Pendência F4-01 (Ajustado)

## 1. Diagnóstico Curto
O problema original era a invisibilidade dos registros em `stock_movements` devido ao uso inconsistente do `owner_user_id` no RPC `receive_purchase_order`. A correção anterior resolvia a visibilidade, mas removia a validação de propriedade (`auth.uid()`) na busca da PO. Este ajuste final garante a segurança validando o proprietário na busca e a visibilidade herdando o `owner_user_id` no registro de movimentação.

## 2. Arquivos Inspecionados
- `supabase/migrations/20260322040629_c16e302e-d991-427d-84d6-3e19d1f176e1.sql` (original)
- `supabase/migrations/20260322050000_fix_f4_01_stock_movements.sql` (ajustado)

## 3. Diff Pequeno
```sql
<<<<
  SELECT * INTO v_po FROM public.purchase_orders WHERE id = p_po_id FOR UPDATE;
====
  SELECT * INTO v_po FROM public.purchase_orders 
  WHERE id = p_po_id AND owner_user_id = v_owner 
  FOR UPDATE;
>>>>
<<<<
  VALUES (..., v_owner);
====
  VALUES (..., v_po.owner_user_id);
>>>>
```

## 4. O que foi corrigido
- Restaurada a segurança: `SELECT ... WHERE id = p_po_id AND owner_user_id = auth.uid()`.
- Garantida a visibilidade: `INSERT INTO stock_movements ... (..., v_po.owner_user_id)`.
- Mantido patch mínimo e comportamento original do restante do fluxo.

## 5. Checklist Manual
- [ ] Receber uma PO em `/admin/gestao/recebimento-compras`.
- [ ] Confirmar entrada visível em `/admin/gestao/movimentos-estoque`.
- [ ] Confirmar que ajuste manual continua funcionando.
