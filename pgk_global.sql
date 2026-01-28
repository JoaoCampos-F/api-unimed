CREATE OR REPLACE package body GC.PGK_GLOBAL is

/*******************************************************/
/**           PROCEDURE DE COMISSAO GLOBAL        **/
/*******************************************************/  
procedure P_MCW_EMPRESA(P_CODIGO          IN VARCHAR  ,
                        P_TODAS           IN VARCHAR  ,                                 
                        P_COD_EMPRESA     IN NUMBER   ,
                        P_COD_BAND        IN VARCHAR  ,
                        P_TIPO            IN VARCHAR  ,
                        P_CATEGORIA       IN VARCHAR  )
as
vCodigo     varchar2(5);
begin
  select a.tipo_empresa 
    into vcodigo
    from mcw_processo a 
   where a.codigo    = p_codigo
     and a.tipo_dado = P_TIPO ;
  /**/
  update gc.empresa_filial
     set processa     = 'N';
  /**/ 
  update tipo_bandeira
     set processa     = 'N';
  commit;
  /**********************************************************************************************/
  /********************                                                          ****************/
  /**********************************************************************************************/ 
  if (P_TODAS = 'S') and (vcodigo ='2') and (P_CATEGORIA = 'PECSER') then
      update gc.empresa_filial
         set processa             = 'S'
       where calcula_comissao     = 'S'
         and cod_band             =  2
         and processa_pecas_serv  = 'S';
      /**/    
      update tipo_bandeira
         set processa     ='S'
       where cod_band     = 2;     
   end if;
   if (P_TODAS = 'S') and (vcodigo ='2') and (P_CATEGORIA = 'COM') then
      update gc.empresa_filial
         set processa              = 'S'
       where calcula_comissao      = 'S'
         and cod_band              =  2
         and processa_veic_cotas   = 'S';
      /**/    
      update tipo_bandeira
         set processa     ='S'
       where cod_band     = 2;     
   end if;   
   /**/
   if (P_TODAS = 'S') and (vcodigo ='2') and (P_CATEGORIA not in ('COM','PECSER')) then
      update gc.empresa_filial
         set processa              = 'S'
       where calcula_comissao      = 'S'
         and cod_band              =  2;
      /**/    
      update tipo_bandeira
         set processa     ='S'
       where cod_band     = 2;     
   end if;
   /**/
   if (P_TODAS = 'S') and (vcodigo = '4') and (P_CATEGORIA = 'COM') then
      update gc.empresa_filial
         set processa              = 'S'
       where calcula_comissao      = 'S'
         and cod_band              = 4
         and processa_veic_cotas   = 'S';
      /**/    
      update tipo_bandeira
         set processa     = 'S'
       where cod_band     = '4';
   end if;
   if (P_TODAS = 'S') and (vcodigo ='4') and (P_CATEGORIA = 'PECSER') then
      update gc.empresa_filial
         set processa              = 'S'
       where calcula_comissao      = 'S'
         and cod_band              =  4
         and processa_pecas_serv   = 'S';
      /**/    
      update tipo_bandeira
         set processa     ='S'
       where cod_band     = 4;     
   end if;
   /**/
   if (P_TODAS = 'S') and (vcodigo = '4') and (P_CATEGORIA not in ('COM','PECSER')) then
      update gc.empresa_filial
         set processa              = 'S'
       where calcula_comissao      = 'S'
         and cod_band              = 4;
      /**/    
      update tipo_bandeira
         set processa     = 'S'
       where cod_band     = '4';
   end if;
   /**********************************************************************************************/
   /********************                                                          ****************/
   /**********************************************************************************************/     
   if (P_TODAS = 'S') and (vcodigo ='T') and (P_COD_BAND = 'T') then
      update gc.empresa_filial
         set processa              = 'S'
       where calcula_comissao      = 'S';
      /**/    
      update tipo_bandeira
         set processa     = 'S'
       where cod_band     in (2,4,5);       
   end if;
   
      if (P_TODAS = 'S') and (vcodigo ='T') and (P_COD_BAND = '5') then
      update gc.empresa_filial
         set processa              = 'S'
       where calcula_comissao      = 'S'
       and cod_band                = 5;
      /**/    
      update tipo_bandeira
         set processa     = 'S'
       where cod_band     in (5);       
      end if;
      
      if (P_TODAS = 'S') and (vcodigo ='T') and (P_COD_BAND = '4') then
      update gc.empresa_filial
         set processa              = 'S'
       where calcula_comissao      = 'S'
       and cod_band                = 4;
      /**/    
      update tipo_bandeira
         set processa     = 'S'
       where cod_band     in (4);       
      end if;
      
     if (P_TODAS = 'S') and (vcodigo ='T') and (P_COD_BAND ='2') then
      update gc.empresa_filial
         set processa              = 'S'
       where calcula_comissao      = 'S'
       and cod_band                = 2;
      /**/    
      update tipo_bandeira
         set processa     = 'S'
       where cod_band     in (2);       
      end if;
   /*********************************************************************************************/
   /******************************                               ********************************/
   /*********************************************************************************************/   
   /*if (P_TODAS = 'N') and (vcodigo ='2') then
      update gc.empresa_filial
         set processa         = 'S'
       where cod_empresa      = P_COD_EMPRESA
         and cod_band         = P_COD_BAND
         and calcula_comissao = 'S';
      \**\    
      update tipo_bandeira
         set processa     = 'S'
       where cod_band     = P_COD_BAND;     
   end if;
   if (P_TODAS = 'N') and (vcodigo = '4') then
      update gc.empresa_filial
         set processa     = 'S'
       where cod_empresa  = P_COD_EMPRESA
         and cod_band     = P_COD_BAND
         and calcula_comissao = 'S';
      \**\    
      update tipo_bandeira
         set processa     = 'S'
       where cod_band     = P_COD_BAND;
   end if;*/
   
   if (P_TODAS = 'N') and (vcodigo ='2') and (P_CATEGORIA = 'PECSER') then
      update gc.empresa_filial
         set processa             = 'S'
       where cod_empresa          = p_cod_empresa
         and cod_band             = p_cod_band
         and calcula_comissao     = 'S'
         and processa_pecas_serv  = 'S';
      /**/    
      update tipo_bandeira
         set processa     ='S'
       where cod_band     = 2;     
   end if;
   if (P_TODAS = 'N') and (vcodigo ='2') and (P_CATEGORIA = 'COM') then
      update gc.empresa_filial
         set processa              = 'S'
       where cod_empresa           = p_cod_empresa
         and cod_band              = p_cod_band 
         and calcula_comissao      = 'S'
         and processa_veic_cotas   = 'S';
      /**/    
      update tipo_bandeira
         set processa     ='S'
       where cod_band     = 2;     
   end if;   
   /**/
   if (P_TODAS = 'N') and (vcodigo ='2') and (P_CATEGORIA not in ('COM','PECSER')) then
      update gc.empresa_filial
         set processa              = 'S'
       where cod_empresa           = p_cod_empresa
         and cod_band              = p_cod_band  
         and calcula_comissao      = 'S';
      /**/    
      update tipo_bandeira
         set processa     ='S'
       where cod_band     = 2;     
   end if;
   /**/
   if (P_TODAS = 'N') and (vcodigo = '4') and (P_CATEGORIA = 'COM') then
      update gc.empresa_filial
         set processa              = 'S'
       where cod_empresa           = p_cod_empresa
         and cod_band              = p_cod_band 
         and calcula_comissao      = 'S'
         and processa_veic_cotas   = 'S';
      /**/    
      update tipo_bandeira
         set processa     = 'S'
       where cod_band     = '4';
   end if;
   if (P_TODAS = 'N') and (vcodigo ='4') and (P_CATEGORIA = 'PECSER') then
      update gc.empresa_filial
         set processa              = 'S'
       where cod_empresa          = p_cod_empresa
         and cod_band             = p_cod_band
         and calcula_comissao     = 'S'
         and processa_pecas_serv  = 'S';
      /**/    
      update tipo_bandeira
         set processa     ='S'
       where cod_band     = 4;     
   end if;
   /**/
   if (P_TODAS = 'N') and (vcodigo = '4') and (P_CATEGORIA not in ('COM','PECSER')) then
      update gc.empresa_filial
         set processa              = 'S'
       where cod_empresa          = p_cod_empresa
         and cod_band             = p_cod_band
         and calcula_comissao     = 'S';
      /**/    
      update tipo_bandeira
         set processa     = 'S'
       where cod_band     = '4';
   end if;   
   /*********************************************************************************************/
   /******************************                               ********************************/
   /*********************************************************************************************/  
   if (P_TODAS = 'N') and (vcodigo ='T') then
      update gc.empresa_filial
         set processa     = 'S'
       where cod_empresa  = P_COD_EMPRESA
         and cod_band     = P_COD_BAND;
      /**/    
      update tipo_bandeira
         set processa     = 'S'
       where cod_band     = P_COD_BAND;       
   end if;
  /**/
  commit; 
end P_MCW_EMPRESA;

procedure P_MCW_EMPRESA_MAPA(P_CODIGO          IN VARCHAR  ,
                             P_TODAS           IN VARCHAR  ,                                 
                             P_COD_EMPRESA     IN NUMBER   ,
                             P_COD_BAND        IN VARCHAR  ,
                             P_TIPO            IN VARCHAR  )
as
vCodigo     varchar2(5);
begin
 select a.tipo_empresa 
   into vcodigo
   from mcw_processo a 
  where a.codigo    = p_codigo
    and a.tipo_dado = P_TIPO ;
  /**/
  update gc.empresa_filial
     set processa     = 'N';
  /**/ 
 update tipo_bandeira
    set processa     = 'N';
 commit;
  /**/  
  if (P_TODAS = 'S') and (vcodigo ='2') then
      update gc.empresa_filial
         set processa         = 'S'
       where processa_mapa    = 'S'
         and cod_band         = 2;
      /**/    
      update tipo_bandeira
         set processa     = 'S'
       where cod_band     = 2;     
   end if;
   if (P_TODAS = 'S') and (vcodigo = '4') then
      update gc.empresa_filial
         set processa         = 'S'
       where processa_mapa    = 'S'
         and cod_band         = 4;
      /**/    
      update tipo_bandeira
         set processa     = 'S'
       where cod_band     = '4';     
   end if;
   
   if (P_TODAS = 'S') and (vcodigo = '5') then
     
      update gc.empresa_filial
         set processa         = 'S'
       where processa_mapa    = 'S'
         and cod_band         = 5;
      /**/    
      update tipo_bandeira
         set processa     = 'S'
       where cod_band     = '4';     
   end if;
   if (P_TODAS = 'S') and (vcodigo ='T') then
      update gc.empresa_filial
         set processa     = 'S'
       where processa_mapa = 'S';
      /**/    
      update tipo_bandeira
         set processa     = 'S'
       where cod_band     in (2,4,5);       
   end if;
   /************************************************/
   /*********                               ********/
   /************************************************/
   if (P_TODAS = 'N') and (vcodigo ='2') then
      update gc.empresa_filial
         set processa         = 'S'
       where cod_empresa      = P_COD_EMPRESA
         and cod_band         = P_COD_BAND
         and processa_mapa = 'S';
      /**/    
      update tipo_bandeira
         set processa     = 'S'
       where cod_band     = P_COD_BAND;     
   end if;
   if (P_TODAS = 'N') and (vcodigo = '4') then
      update gc.empresa_filial
         set processa      = 'S'
       where cod_empresa   = P_COD_EMPRESA
         and cod_band      = P_COD_BAND
         and processa_mapa = 'S';
      /**/    
      update tipo_bandeira
         set processa     = 'S'
       where cod_band     = P_COD_BAND;  
   end if;
   if (P_TODAS = 'N') and (vcodigo ='T') then
      update gc.empresa_filial
         set processa      = 'S'
       where cod_empresa   = P_COD_EMPRESA
         and cod_band      = P_COD_BAND
         and processa_mapa = 'S';
      /**/    
      update tipo_bandeira
         set processa     = 'S'
       where cod_band     = P_COD_BAND;       
   end if;
  /**/
  commit; 
end P_MCW_EMPRESA_MAPA;

/************************************************************/ 
/************  Seta parametro da Empresa e Departamento *****/ 
/************************************************************/ 
PROCEDURE P_MCW_FECHA_COMISSAO_GLOBAL(P_CODIGO           IN VARCHAR,
                                      P_MES_REF          IN NUMBER,
                                      P_ANO_REF          IN NUMBER,                                                           
                                      P_PREVIA           IN VARCHAR,
                                      P_APAGA            IN VARCHAR,
                                      P_USUARIO          IN VARCHAR,
                                      P_TODAS            IN VARCHAR,
                                      P_COD_EMPRESA      IN NUMBER,
                                      P_COD_BAND         IN VARCHAR,
                                      P_TIPO             IN VARCHAR,
                                      P_CATEGORIA        IN VARCHAR,
                                      P_CPF              IN VARCHAR)
is
 vHoraInicio1      date;
 vHoraInicio2      date;           
begin

  /************************************************************/ 
  /************  Seta parametro da Empresa e Departamento *****/ 
  /************************************************************/ 
  begin
 if ((P_CODIGO = '70000001') OR (P_CODIGO = '70000008') OR (P_CODIGO ='70000009') OR (P_CODIGO = '90000001')) then --ver isso dps
    P_MCW_EMPRESA_MAPA(P_CODIGO,P_TODAS,P_COD_EMPRESA,P_COD_BAND,P_TIPO);-- processa as empresas caso seja o mapa Resumo
  else
    P_MCW_EMPRESA(P_CODIGO,P_TODAS,P_COD_EMPRESA,P_COD_BAND,P_TIPO,P_CATEGORIA);-- processa as empresas de DADOS, REALIZADO E COMISSÃO
    end if; 
  end; 
  /************************************************************************/
  /*****************      PROCEDURE COMISSAO COMERCIAL ********************/
  /************************************************************************/
  /* 02 - Processa Comissão Veiculo Estorno*/
  if P_CODIGO = '20000001' then 
  begin
    select sysdate into  vHoraInicio1 from dual;
      PKG_MCW_COMERCIAL.P_MCW_VEICULO_ESTORNO(P_MES_REF,P_ANO_REF,P_APAGA);
  end;
  end if;
  /************************************************************************/
  /*****************      PROCEDURE COMISSAO COMERCIAL ********************/
  /************************************************************************/
  /* 02 - Processa Comissão Veiculo Estorno*/
  if P_CODIGO = '20000002' then 
  begin
    select sysdate into  vHoraInicio1 from dual;
     PKG_MCW_COMERCIAL.P_MCW_DADOS_COTAS(P_MES_REF,P_ANO_REF,P_APAGA, P_TIPO);
  end;
  end if;
  /************************************************************************/
  /*****************      PROCEDURE COMISSAO COMERCIAL ********************/
  /************************************************************************/
  /* 02 - Processa Comissão Dados Cotas P23*/
  if P_CODIGO = '20000003' then 
  begin
    select sysdate into  vHoraInicio1 from dual;
      PKG_MCW_COMERCIAL.P_MCW_DADOS_COTAS_DV_P23(P_MES_REF,P_ANO_REF,P_APAGA, P_TIPO);
  end;
  end if;
  /************************************************************************/
  /*****************      PROCEDURE COMISSAO COMERCIAL ********************/
  /************************************************************************/
  /* 02 - Processa Cotas INAD / ADIMPLENCIA*/
  if P_CODIGO = '20000004' then 
  begin
    select sysdate into  vHoraInicio1 from dual;
      PKG_MCW_COMERCIAL.P_MCW_COTAS_INAD_ADIMP(P_MES_REF,P_ANO_REF,P_APAGA,P_TIPO);
  end;
  end if;  
  /************************************************************************/
  /*****************      PROCEDURE COMISSAO COMERCIAL ********************/
  /************************************************************************/
  /* 02 - Processa Comissao Veiculo 2 Rodas*/
  if P_CODIGO = '20000005' then 
  begin
    select sysdate into  vHoraInicio1 from dual;
     PKG_MCW_COMERCIAL.P_MCW_COMISSAO_VEICULOS_2R(P_MES_REF,P_ANO_REF,P_APAGA,P_TIPO);
  end;
  end if;  
  /************************************************************************/
  /*****************      PROCEDURE COMISSAO COMERCIAL ********************/
  /************************************************************************/
  /* 02 - Processa Comissao Veiculo 4 Rodas*/
  if P_CODIGO = '20000006' then 
  begin
    select sysdate into  vHoraInicio1 from dual;
      PKG_MCW_COMERCIAL.P_MCW_COMISSAO_VEICULOS_4R(P_MES_REF,P_ANO_REF,P_APAGA, P_TIPO);
  end;
  end if;  
  /************************************************************************/
  /*****************      PROCEDURE COMISSAO COMERCIAL ********************/
  /************************************************************************/
  /* 02- Processa Comissao Consorcio 2 Rodas*/
  if P_CODIGO = '20000007' then 
  begin
    select sysdate into  vHoraInicio1 from dual;
      PKG_MCW_COMERCIAL.P_MCW_COMISSAO_CONSORCIO_2R(P_MES_REF,P_ANO_REF,P_APAGA,P_TIPO);
  end;
  end if;
  /************************************************************************/
  /*****************      PROCEDURE COMISSAO COMERCIAL ********************/
  /************************************************************************/
  /* 02 - Processa Comissao Consorcio 4 Rodas*/
  if P_CODIGO = '20000008' then 
  begin
    select sysdate into  vHoraInicio1 from dual;
      PKG_MCW_COMERCIAL.P_MCW_COMISSAO_CONSORCIO_4R(P_MES_REF,P_ANO_REF,P_APAGA,P_TIPO);
  end;
  end if;
  /************************************************************************/
  /*****************      PROCEDURE COMISSAO COMERCIAL ********************/
  /************************************************************************/
  /* 02- Processa Comissão Dados Veiculo*/
  if P_CODIGO = '20000009' then 
  begin
    select sysdate into  vHoraInicio1 from dual;
    PKG_MCW_COMERCIAL.P_MCW_DADOS_VEIC(P_MES_REF,P_ANO_REF,P_APAGA, P_TIPO);
  end;
  end if;
  /************************************************************************/
  /*****************      PROCEDURE COMISSAO COMERCIAL ********************/
  /************************************************************************/
  /* 02- Processa Dados Bonus*/
  if P_CODIGO = '20000012' then 
  begin
    select sysdate into  vHoraInicio1 from dual;
    PKG_MCW_COMERCIAL.P_MCW_BONUS(P_MES_REF,P_ANO_REF,P_APAGA, P_TIPO);
  end;
  end if;
  /************************************************************************/
  /*****************      PROCEDURE COMISSAO COMERCIAL ********************/
  /************************************************************************/
  /* 02- Processa Dados CRM*/
  if P_CODIGO = '20000013' then 
  begin
    select sysdate into  vHoraInicio1 from dual;
    PKG_MCW_COMERCIAL.P_MCW_CRM_VENDEDOR(P_MES_REF,P_ANO_REF,P_APAGA, P_TIPO);
  end;
  end if; 
  
    /* 02- Comissao Acessorios dos veiculos*/
  if P_CODIGO = '20000014' then 
  begin
    select sysdate into  vHoraInicio1 from dual;
    PKG_MCW_COMERCIAL.P_MCW_ACESSORIO(P_MES_REF,P_ANO_REF,P_APAGA, P_TIPO);
  end;
  end if; 
  
  /************************************************************************/
  /****************PROCEDURE COMISSAO PEÇAS E SERVICOS ********************/
  /************************************************************************/
  /* 03- Processa Dados de Pecas de 2 e 4 Rodas*/
  if P_CODIGO = '30000001' then 
  begin
    select sysdate into  vHoraInicio1 from dual;
     PKG_MCW_POS_VENDA.P_MCW_DADOS_PECAS_COM(P_MES_REF,P_ANO_REF,P_APAGA, P_TIPO);
  end;
  end if;
  /************************************************************************/
  /****************PROCEDURE COMISSAO PEÇAS E SERVICOS ********************/
  /************************************************************************/
  /* 03- Processa Dados de Recepcao de 2 e 4 Rodas*/
  if P_CODIGO = '30000002' then 
  begin
    select sysdate into  vHoraInicio1 from dual;
     PKG_MCW_POS_VENDA.P_MCW_DADOS_RECEPCAO_COM(P_MES_REF,P_ANO_REF,P_APAGA, P_TIPO);
  end;
  end if;
  /************************************************************************/
  /****************PROCEDURE COMISSAO PEÇAS E SERVICOS ********************/
  /************************************************************************/
  /* 03- Processa Dados de Servico de 2 e 4 Rodas*/
  if P_CODIGO = '30000003' then 
  begin
    select sysdate into  vHoraInicio1 from dual;
    PKG_MCW_POS_VENDA.P_MCW_DADOS_SERVICOS_COM(P_MES_REF,P_ANO_REF,P_APAGA, P_TIPO);
  end;
  end if;
  /************************************************************************/
  /****************PROCEDURE COMISSAO PEÇAS E SERVICOS ********************/
  /************************************************************************/
  /* 03- Processa Dados da Boqueta de 2 e 4 Rodas*/
  if P_CODIGO = '30000004' then 
  begin
    select sysdate into  vHoraInicio1 from dual;
    PKG_MCW_POS_VENDA.P_MCW_DADOS_BOQUETA(P_MES_REF,P_ANO_REF,P_APAGA);
  end;
  end if;    
  /************************************************************************/
  /****************PROCEDURE COMISSAO PEÇAS E SERVICOS ********************/
  /************************************************************************/
  /* 03- Processa Dados de Consultor de 2 e 4 Rodas*/
  if P_CODIGO = '30000005' then 
  begin
    select sysdate into  vHoraInicio1 from dual;
    PKG_MCW_POS_VENDA.P_MCW_DADOS_CONSULTOR(P_MES_REF,P_ANO_REF,P_APAGA, P_TIPO);
  end;
  end if;  
  /************************************************************************/
  /****************PROCEDURE COMISSAO PEÇAS E SERVICOS ********************/
  /************************************************************************/
  /* 03- Processa Dados de Horas Vendidas*/
    if P_CODIGO = '30000006' then 
  begin
    select sysdate into  vHoraInicio1 from dual;
    PKG_MCW_POS_VENDA.P_MCW_DADOS_HORAS_VENDIDA(P_MES_REF,P_ANO_REF,P_TIPO);
  end;
  end if;
  /************************************************************************/
  /****************PROCEDURE COMISSAO PEÇAS E SERVICOS ********************/
  /************************************************************************/
  /* 03- Processa Realizado Pecas e Servicos*/
  if P_CODIGO = '30000007' then 
  begin
    select sysdate into  vHoraInicio1 from dual;
    PKG_MCW_POS_VENDA.P_MCW_REALIZADO_PECAS_SERV(P_MES_REF,P_ANO_REF, P_TIPO,P_APAGA);
  end;
  end if;
  /************************************************************************/
  /****************PROCEDURE COMISSAO PEÇAS E SERVICOS ********************/
  /************************************************************************/
  /* 03- Processa Comissao de Pecas e Servicos.*/
  if P_CODIGO = '30000008' then 
  begin
    select sysdate into  vHoraInicio1 from dual;
     --PKG_MCW_POS_VENDA.P_MCW_COMISSAO_PECA_SERV(P_MES_REF,P_ANO_REF,P_APAGA, P_TIPO);
  end;
  end if;
  /************************************************************************/
  /****************PROCEDURE COMISSAO PEÇAS E SERVICOS ********************/
  /************************************************************************/
  /* 03- Processa Estoque de Pecas de 2 e 4 Rodas*/
    if P_CODIGO = '30000009' then 
  begin
    select sysdate into  vHoraInicio1 from dual;
     PKG_MCW_POS_VENDA.P_MCW_ESTOQ_PECAS(P_MES_REF,P_ANO_REF,P_APAGA);
  end;
  end if;
  
  /************************************************************************/
  /****************PROCEDURE COMISSAO PEÇAS E SERVICOS ********************/
  /************************************************************************/
  /* 03- Processa Obsoleto de Pecas de 2 e 4 Rodas.*/
    if P_CODIGO = '30000010' then 
  begin
    select sysdate into  vHoraInicio1 from dual;
     PKG_MCW_POS_VENDA.P_MCW_OBSOLETO_PECAS(P_MES_REF,P_ANO_REF,P_APAGA,P_TIPO);
  end;
  end if;
  
  /************************************************************************/
  /****************PROCEDURE COMISSAO PEÇAS E SERVICOS ********************/
  /************************************************************************/
  /* 03- Processa Realizado de peças e Serviços Individual de 2 e 4 Rodas.*/
    if P_CODIGO = '30000016' then 
  begin
    select sysdate into  vHoraInicio1 from dual;
     PKG_MCW_POS_VENDA.P_MCW_REALIZADO_PECAS_SERV_INDI(P_MES_REF,P_ANO_REF,P_TIPO,P_APAGA);
  end;
  end if;
  /************************************************************************/
  /****************PROCEDURE COMISSAO PEÇAS E SERVICOS ********************/
  /************************************************************************/
  /* 03- Processa Realizado de peças e Serviços Individual Produtivo de 2 e 4 Rodas.*/
    if P_CODIGO = '30000017' then 
  begin
    select sysdate into  vHoraInicio1 from dual;
     PKG_MCW_POS_VENDA.P_MCW_REALIZADO_PRODUTIVO_INDI(P_MES_REF,P_ANO_REF,P_TIPO,P_APAGA);
  end;
  end if;
  
  /************************************************************************/
  /****************PROCEDURE COMISSAO PEÇAS E SERVICOS ********************/
  /************************************************************************/
  /* 03- PROCESSA DADOS DA HORAS VENDIDA  FUNILARIA E PINTURA 2 e 4 rodas.*/
    if P_CODIGO = '30000018' then 
  begin
    select sysdate into  vHoraInicio1 from dual;
     PKG_MCW_POS_VENDA.P_MCW_DADOS_HRS_VEND_FUN_PINT(P_MES_REF,P_ANO_REF,P_TIPO);
  end;
  end if; 
  
  /************************************************************************/
  /*****************      PROCEDURE COMISSAO GERENTES    ******************/
  /************************************************************************/
  /* 02 - Processa Dados Globais.*/
  if P_CODIGO = '40000002' then 
  begin
    select sysdate into  vHoraInicio1 from dual;
    PKG_MCW_DADOS.P_MCW_DADOS_VEIC_CONS(P_MES_REF,P_ANO_REF,P_TIPO,P_APAGA );
  end;
  end if; 
  /************************************************************************/
   /*****************      PROCEDURE COMISSAO GERENTES    ******************/
  /************************************************************************/
  /* 03- Processa dados Individuais.*/
  if P_CODIGO = '40000003' then 
  begin
    select sysdate into  vHoraInicio1 from dual;
    PKG_MCW_DADOS.P_MCW_DADOS_INDIVIDUAL(P_MES_REF,P_ANO_REF,P_TIPO,P_APAGA );
  end;
  end if; 
  
  /************************************************************************/
  /*****************      PROCEDURE COMISSAO GERENTES    ******************/
  /************************************************************************/
  /* 01 - Processa notas de Servicos.*/
  if P_CODIGO = '40000004' then 
  begin
    select sysdate into  vHoraInicio1 from dual;
    PKG_MCW_DADOS.P_MCW_DADOS_NF_SERVICO(P_MES_REF,P_ANO_REF,P_APAGA,P_TIPO);
  end;
  end if; 
  
  /************************************************************************/
  /*****************      PROCEDURE COMISSAO GERENTES    ******************/
  /************************************************************************/
  /* 01 - Processa Veiculo Trimestre.*/
  if P_CODIGO = '40000005' then 
  begin
    select sysdate into  vHoraInicio1 from dual;
      PKG_MCW_DADOS.P_MCW_DADOS_VEIC_TRIMESTRE(P_MES_REF,P_ANO_REF,P_APAGA,P_TIPO);
  end;
  end if; 
  
    /************************************************************************/
  /*****************      PROCEDURE COMISSAO GERENTES    ******************/
  /************************************************************************/
  /* 01 - Processa Meta de estoque de 4 Rodas.*/
  if P_CODIGO = '40000008' then 
  begin
    select sysdate into  vHoraInicio1 from dual;
      PKG_MCW_DADOS.P_MCW_META_AUTOMATICO(P_MES_REF,P_ANO_REF,P_TIPO);
  end;
  end if; 
  
  
 /************************************************************************/
  /*****************      PROCEDURE DADOS SUPERVISORES ********************/
  /************************************************************************/
  /* 05 - Processa Dados Supervisores.*/
  if P_CODIGO = '50000001' then 
  begin
    select sysdate into  vHoraInicio1 from dual;
      PKG_MCW_EQUIPE.P_MCW_DADOS_EQUIPE(P_MES_REF,P_ANO_REF,P_TIPO,P_APAGA);
  end;
  end if; 
  /************************************************************************/
  /*****************      PROCEDURE COMISSAO SUPERVISORES ********************/
  /************************************************************************/
  /* 05 - Processa Comissão Supervisores*/
  if P_CODIGO = '50000002' then 
  begin
    select sysdate into  vHoraInicio1 from dual;
      PKG_MCW_EQUIPE.P_MCW_COMISSAO_EQUIPE(P_MES_REF,P_ANO_REF,P_TIPO,P_APAGA);
  end;
  end if; 
  
    /************************************************************************/
  /*****************      PROCEDURE COMISSAO SUPERVISORES ********************/
  /************************************************************************/
  /* 05 - Processa Comissão Supervisores*/
  if P_CODIGO = '50000003' then 
  begin
    select sysdate into  vHoraInicio1 from dual;
      pkg_mcw_comercial.P_MCW_CRM_SUPERVISOR(P_MES_REF,P_ANO_REF,P_TIPO,P_APAGA);
  end;
  end if; 
  
  /* 05 - Processa Meta Automatica*/
  if P_CODIGO = '50000005' then 
  begin
    select sysdate into  vHoraInicio1 from dual;
      PKG_MCW_EQUIPE.P_MCW_META_AUTO_PV();
  end;
  end if; 
  
    /* 05 - Processa Resumo Equipe*/
  if P_CODIGO = '50000008' then 
  begin
    select sysdate into  vHoraInicio1 from dual;
     PKG_MCW_EQUIPE.P_MCW_RESUMO_EQUIPE(P_MES_REF,P_ANO_REF,P_TIPO,P_APAGA);
  end;
  end if;  
  
  /* 05 - Realizado Geral Supervisor*/
  if P_CODIGO = '50000011' then 
  begin
    select sysdate into  vHoraInicio1 from dual;
      PKG_MCW_EQUIPE.P_MCW_REALIZADO_GERAL_SUPERVISOR(P_MES_REF,P_ANO_REF,P_TIPO,P_APAGA);
  end;
  end if; 
    /* 05 - Realizado Geral Supervisor*/
  if P_CODIGO = '50000012' then 
  begin
    select sysdate into  vHoraInicio1 from dual;
      PKG_MCW_EQUIPE.P_MCW_COMISSAO_SUPERV_GERAL(P_MES_REF,P_ANO_REF,P_TIPO,P_APAGA);
  end;
  end if; 
  /************************************************************************/
  /*****************      PROCEDURE PPLR **********************************/
  /************************************************************************/ 
  /* 06 - Processa PPLR Gerentes ADM,COMERCIAL, GERAL*/
  if P_CODIGO = '60000001' then 
  begin
    select sysdate into  vHoraInicio1 from dual;
      PKG_MCW_PPLR.P_PPLR_GERENTES(P_MES_REF,P_ANO_REF,P_APAGA,P_TIPO,P_CPF);
  end;
  end if;
   /************************************************************************/
  /*****************      PROCEDURE PPLR **********************************/
  /************************************************************************/
  /* 06 - Processa PPLR empresa*/
  if P_CODIGO = '60000002' then 
  begin
    select sysdate into  vHoraInicio1 from dual;
      PKG_MCW_PPLR.P_PPLR_SUPERVISOR(P_MES_REF,P_ANO_REF,P_APAGA,P_TIPO,P_CPF);
  end;
  end if;
   /************************************************************************/
  /*****************      PROCEDURE PPLR **********************************/
  /************************************************************************/
  /* 06 - Processa PPLR individual*/
  if P_CODIGO = '60000003' then 
  begin
    select sysdate into  vHoraInicio1 from dual;
      PKG_MCW_PPLR.P_PPLR_INDIVIDUAL(P_MES_REF,P_ANO_REF,P_APAGA,P_TIPO,P_CPF);
  end;
  end if;
   /************************************************************************/
  /*****************      PROCEDURE PPLR **********************************/
  /************************************************************************/  
  /*\* 06 - Processa Dados Supervisores*\  
  if P_CODIGO = '60000004' then 
  begin
    select sysdate into  vHoraInicio1 from dual;
      PKG_MCW_PPLR.P_MCW_DADOS_SUPERVISOR(P_MES_REF,P_ANO_REF,P_APAGA,P_TIPO);
  end;
  end if; */  
  /************************************************************************/
  /*****************      PROCEDURE PPLR **********************************/
  /************************************************************************/
  /**06 - Processa Pecas e Servicos**/  
  if P_CODIGO = '60000005' then 
  begin
    select sysdate into  vHoraInicio1 from dual;
      PKG_MCW_PPLR.P_PPLR_PECAS(P_MES_REF,P_ANO_REF,P_APAGA,P_TIPO,P_CPF);
  end;
  end if; 
   /*************************************************************************/
  /*****************      PROCEDURE PPLR ************************************/
  /**************************************************************************/
  /* 06 - Administrativo*/  
  if P_CODIGO = '60000006' then 
  begin
    select sysdate into  vHoraInicio1 from dual;
      PKG_MCW_PPLR.P_PPLR_ADM(P_MES_REF,P_ANO_REF,P_APAGA,P_TIPO,P_CPF);
  end;
  end if;  
  /************************************************************************/
  /*****************      PROCEDURE PPLR **********************************/
  /************************************************************************/
  /**06 - Administrativo EC**/  
  if P_CODIGO = '60000007' then 
  begin
    select sysdate into  vHoraInicio1 from dual;
      PKG_MCW_PPLR.P_PPLR_ADM_EC(P_MES_REF,P_ANO_REF,P_APAGA,P_TIPO,P_CPF);
  end;
  end if;
   /************************************************************************/
  /*****************      PROCEDURE PPLR **********************************/
  /************************************************************************/
  /**06 - RESUMO pplr**/  
  if P_CODIGO = '60000009' then 
  begin
    select sysdate into  vHoraInicio1 from dual;
      PKG_MCW_PPLR.P_PPLR_RESUMO(P_ANO_REF,P_COD_EMPRESA,P_COD_BAND,P_APAGA);
  end;
  end if;

  /************************************************************************/
  /*****************      PROCEDURE ADMINISTRATIVO ********************/
  /************************************************************************/
  /* 07 - Mapa Resumo Geral*/  
  if P_CODIGO = '70000001' then 
  begin
    select sysdate into  vHoraInicio1 from dual;
     PKG_MCW_ADM.P_MCW_MAPA_GERAL(P_MES_REF,P_ANO_REF,P_APAGA,P_CPF);
  end;
  end if;  
  /************************************************************************/
  /*****************      PROCEDURE ADMINISTRATIVO ********************/
  /************************************************************************/
  /* 07 - Processa Dados Notas Fiscal Seguros*/  
  if P_CODIGO = '70000003' then 
  begin
    select sysdate into  vHoraInicio1 from dual;
    PKG_MCW_DADOS.P_MCW_DADOS_NF_SEGUROS(P_MES_REF,P_ANO_REF,P_APAGA,P_TIPO);
  end;
  end if;
  /************************************************************************/
  /*****************      PROCEDURE ADMINISTRATIVO ********************/
  /************************************************************************/
  /* 07 - Inadiplencia de Cobrança 2 e 4 Rodas*/  
  if P_CODIGO = '70000005' then 
  begin
    select sysdate into  vHoraInicio1 from dual;
     PKG_MCW_ADM.P_MCW_INAD_FINAN(P_MES_REF,P_ANO_REF,P_APAGA);
  end;
  end if;
  /************************************************************************/
  /*****************      PROCEDURE ADMINISTRATIVO ********************/
  /************************************************************************/
  /* 07 - Exporta Colaboradores para folha*/  
  if P_CODIGO = '70000008' then 
  begin
    select sysdate into  vHoraInicio1 from dual;
     pkg_mcw_adm.P_EXP_TOTVS_COMISSAO(P_MES_REF,P_ANO_REF,P_TIPO,P_APAGA);
  end;
  end if;
  /************************************************************************/
  /*****************      PROCEDURE ADMINISTRATIVO ********************/
  /************************************************************************/
  /* 07 - Exporta Colaboradores para folha*/  
  if P_CODIGO = '70000009' then 
  begin
    select sysdate into  vHoraInicio1 from dual;
     pkg_mcw_adm.P_EXP_TOTVS_COMISSAO_GERENTES(P_MES_REF,P_ANO_REF,P_TIPO, P_APAGA);
  end;
  end if;
  
   /************************************************************************/
  /*****************      PROCEDURE ADMINISTRATIVO ********************/
  /************************************************************************/
  /* Exporta Colaboradores para folha Fazendas*/  
  if P_CODIGO = '70000012' then 
  begin
    select sysdate into  vHoraInicio1 from dual;
     pkg_mcw_adm.P_EXP_TOTVS_EVENTO_0007(P_MES_REF,P_ANO_REF,P_TIPO, P_APAGA);
  end;
  end if;
  
  /************************************************************************/
  /*****************      PROCEDURE ADMINISTRATIVO ********************/
  /************************************************************************/
  /* Exporta Colaboradores para folha Fazendas*/  
  if P_CODIGO = '70000011' then 
  begin
    select sysdate into  vHoraInicio1 from dual;
     pkg_mcw_adm.P_EXP_TOTVS_FAZENDAS(P_MES_REF,P_ANO_REF,P_TIPO, P_APAGA);
  end;
  end if;
  /************************************************************************/
  /*****************      PROCEDURE COMISSAO GERAL ********************/
  /************************************************************************/
  /* 08 - Exporta Colaboradores para folha*/  
  if P_CODIGO = '80000001' then 
  begin
    select sysdate into  vHoraInicio1 from dual;
    PKG_MCW_GLOBAL.P_MCW_COMISSAO_GERAL(P_MES_REF,P_ANO_REF,P_APAGA,P_TIPO,P_CPF);
  end;
  end if; 
  
   /* 08 - Exporta Colaboradores para folha*/  
  if P_CODIGO = '80000002' then 
  begin
    select sysdate into  vHoraInicio1 from dual;
    PKG_MCW_GLOBAL.P_MCW_COMISSAO_GERAL_EC(P_MES_REF,P_ANO_REF,P_APAGA,P_TIPO,P_CPF);
  end;
  end if; 
  
     /* 08 - Gera dados de Horas Extras*/  
  if P_CODIGO = '80000003' then 
  begin
    select sysdate into  vHoraInicio1 from dual;
    pkg_mcw_dados.P_MCW_DADOS_HORAS_EXTRAS();
  end;
  end if; 
  
 /* 08 - Calcula a dedução das ferias de comissão e bonus*/  
  if P_CODIGO = '80000004' then 
  begin
    select sysdate into  vHoraInicio1 from dual;
    PKG_MCW_GLOBAL.P_MCW_COMISSAO_FRACIONADA(P_MES_REF,P_ANO_REF,P_TIPO,P_APAGA);
  end;
  end if; 
   /************************************************************************/
  /*****************      PROCEDURE COMISSAO GERAL ********************/
  /************************************************************************/
  /* 09 - Exporta Colaboradores para folha*/  
  if P_CODIGO = '90000001' then 
  begin
    select sysdate into  vHoraInicio1 from dual;
    PKG_UNI_SAUDE.P_EXP_PLANO_SAUDE(P_MES_REF,P_ANO_REF,P_TIPO,P_APAGA,P_CPF);
  end;
  end if;   
  /************************************************************************/
  /*****************   PROCEDURE PPLR - FINAL            ******************/
  /************************************************************************/  
  update mcw_processo
   set data_proc = sysdate,
       usuario   = p_usuario
 where codigo    = p_codigo;
 
   /**/
  update gc.empresa_filial
     set processa     = 'S'
   where calcula_comissao      = 'S';
  /**/ 
 update tipo_bandeira
    set processa     = 'S';
  
 
  /**/
  select sysdate into  vHoraInicio2 from dual;  
  insert 
    into mcw_processo_log
        (codigo,  
         usuario,
         data_proc,
         mes_ref,
         ano_ref,
         apaga,
         previa,
         HORA1,
         HORA2,
         MENSAGEM,
         categoria,
         PARAMETRO)
    values
        (p_codigo,  
         p_usuario,
         sysdate,
         p_mes_ref,
         p_ano_ref,
         P_APAGA,
         P_PREVIA,
         vHoraInicio1,
         vHoraInicio2,       
         'Processado(s) Com Sucesso(s)',
          P_CATEGORIA,
         'Codigo: '||P_CODIGO||' Mes: '||P_MES_REF||' Ano: '||P_ANO_REF||' Previa: '||P_PREVIA||' Pagar: '||P_APAGA||' Usuario: '||P_USUARIO||' T. Emp: '||P_TODAS||' Cod Emp: '|| P_COD_EMPRESA||' Band: '||P_COD_BAND||' Tipo: '|| P_TIPO||' CAT: '|| P_CATEGORIA);
  /**/ 
  
  commit;
  exception
    when others then
    raise_application_error(-20001,'An error was encountered - '||SQLCODE||' -ERROR- '||SQLERRM);
                                                           
end P_MCW_FECHA_COMISSAO_GLOBAL;

 
/*******************************************************/
/**           PROCEDURE DE COMISSAO GLOBAL        **/
/*******************************************************/  
procedure P_MCW_PROCESSO_LOG(P_CODIGO           IN VARCHAR,
                             P_MES_REF          IN NUMBER,
                             P_ANO_REF          IN NUMBER,
                             P_APAGA            IN VARCHAR,
                             P_USUARIO          IN VARCHAR,
                             P_CATEGORIA        IN VARCHAR)
as

   vHoraInicio1      date;
   vHoraInicio2      date; 
begin
  update mcw_processo
   set data_proc = sysdate,
       usuario   = p_usuario
 where codigo    = p_codigo;
 
  /**/
  select sysdate into  vHoraInicio2 from dual;  
  insert 
    into mcw_processo_log
        (codigo,  
         usuario,
         data_proc,
         mes_ref,
         ano_ref,
         apaga,
         HORA1,
         HORA2,
         categoria)
    values
        (p_codigo,  
         p_usuario,
         sysdate,
         p_mes_ref,
         p_ano_ref,
         P_APAGA,       
         vHoraInicio1,
         vHoraInicio2,
         P_CATEGORIA);  
  commit;
  exception
    when others then
    raise_application_error(-20001,'An error was encountered - '||SQLCODE||' -ERROR- '||SQLERRM);
end P_MCW_PROCESSO_LOG;


end PGK_GLOBAL;
