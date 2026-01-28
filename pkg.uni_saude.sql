CREATE OR REPLACE package body GC.PKG_uni_saude is
/**/
PROCEDURE P_UNI_RESUMO(p_mes_ref in number,
                       p_ano_ref in number)
is
 /**/
cursor sqlDados is
select   a.cod_empresa,
         a.codcoligada,
         a.codfilial,
         a.cod_band,
         a.mes_ref,
         a.ano_ref,
         a.mes_import,
         a.ano_import,
         a.codigo_cpf,
         a.chapa,
         a.ativo,
         a.contrato,
         a.mensalidade_titular,
         a.mensalidade_depedente,
         a.valor_mensalidade_titular,
         a.valor_mensalidade_empresa,
         a.valor_utilizado,
         a.valor_total,
         a.valor_liquido,
         a.unimed_empresa_paga
from vw_uni_dados_cobranca a
where 1=1
      and  a.mes_import  = p_mes_ref
      and  a.ano_import  = p_ano_ref      
order by
         a.cod_band,
         a.cod_empresa,
         a.titular;
  /**/
      v_cod_empresa         integer;
      v_codcoligada         integer;
      v_codfilial           integer;
      v_cod_band            integer;
      v_mes_ref             integer;
      v_ano_ref             integer;
      v_mes_ref_import      integer;
      v_ano_ref_import      integer;
      v_codigo_cpf          varchar(15);
      v_chapa               varchar(16);
      v_ativo               varchar(2);
      v_contrato            varchar(16);
      v_m_titular           decimal(10,2);
      v_m_dependente        decimal(10,2);
      v_m_liq_titular       decimal(10,2);
      v_m_liq_empresa       decimal(10,2);
      v_valor_consumo       decimal(10,2);
      v_valor_total         decimal(10,2);
      v_valor_liquido       decimal(10,2);
      v_unimed_empresa_paga varchar(2);
      /**/

begin
  open sqlDados;
        v_cod_empresa         := '';
        v_codcoligada         := '';
        v_codfilial           := '';
        v_cod_band            := '';
        v_mes_ref             := '';
        v_ano_ref             := '';
        v_mes_ref_import      := '';
        v_ano_ref_import      := '';
        v_codigo_cpf          := '';
        v_chapa               := '';
        v_ativo               := '';
        v_contrato            := '';
        v_m_titular           := '';
        v_m_dependente        := '';
        v_m_liq_titular       := '';
        v_m_liq_empresa       := '';
        v_valor_consumo       := '';
        v_valor_total         := '';
        v_valor_liquido       := '';
        v_unimed_empresa_paga := '';
    loop
        fetch sqlDados into
              v_cod_empresa,
              v_codcoligada,
              v_codfilial,
              v_cod_band,
              v_mes_ref,
              v_ano_ref,
              v_mes_ref_import,
              v_ano_ref_import,
              v_codigo_cpf,
              v_chapa,
              v_ativo,
              v_contrato,
              v_m_titular,
              v_m_dependente,
              v_m_liq_titular,
              v_m_liq_empresa,
              v_valor_consumo,
              v_valor_total,
              v_valor_liquido,
              v_unimed_empresa_paga;
        exit when sqlDados%notfound;

       /* se o colaborador for demitido e vir gastos ou casos em que a empresa custeia tudo*/
      if  ((v_ativo ='N' and v_m_titular = 0) or (v_unimed_empresa_paga = 'S')) then
      begin
          v_m_liq_empresa := v_valor_total;
          v_valor_liquido :=0;
      end;
      end if;
      /**/
          update uni_resumo_colaborador  set
                 cod_empresa    = v_cod_empresa,
                 codcoligada    = v_codcoligada,
                 codfilial      = v_codfilial,
                 codigo_cpf     = v_codigo_cpf,
                 mes_ref        = v_mes_ref,
                 ano_ref        = v_ano_ref,
                 m_titular      = v_m_titular,
                 m_dependente   = v_m_dependente,
                 valor_consumo  = v_valor_consumo,
                 perc_empresa   = v_m_liq_empresa,
                 valor_total    = v_valor_total,
                 valor_liquido  = v_valor_liquido,
                 exporta        = 'S',
                 chapa          = v_chapa,
                 contrato       = v_contrato,
                 cod_band       = v_cod_band,
                 ativo          = v_ativo,
                 mes_ref_import = v_mes_ref_import,
                 ano_ref_import = v_ano_ref_import,
                 data_proc      = sysdate
           where cod_empresa    = v_cod_empresa
             and codcoligada    = v_codcoligada
             and codfilial      = v_codfilial
             and codigo_cpf     = v_codigo_cpf
             and mes_ref        = v_mes_ref
             and ano_ref        = v_ano_ref
             and cod_band       = v_cod_band
             and mes_ref_import = v_mes_ref_import
             and ano_ref_import = v_ano_ref_import;
         ---verifica se houve update e se não houve faz insert--
     if  sql%rowcount = 0 then
       insert into uni_resumo_colaborador
                                    (cod_empresa,
                                     codcoligada,
                                     codfilial,
                                     codigo_cpf,
                                     --nome,
                                     mes_ref,
                                     ano_ref,
                                     m_titular,
                                     m_dependente,
                                     valor_consumo,
                                     perc_empresa,
                                     valor_total,
                                     valor_liquido,
                                     exporta,
                                     chapa,
                                     contrato,
                                     ativo,
                                     cod_band,
                                     mes_ref_import,
                                     ano_ref_import,
                                     data_proc)
                                  values
                                    (v_cod_empresa,
                                     v_codcoligada,
                                     v_codfilial,
                                     v_codigo_cpf,
                                    -- v_nome,
                                     v_mes_ref,
                                     v_ano_ref,
                                     v_m_titular,
                                     v_m_dependente,
                                     v_valor_consumo,
                                     v_m_liq_empresa,
                                     v_valor_total,
                                     v_valor_liquido,
                                     'S',                                    
                                     v_chapa,
                                     v_contrato,
                                     v_ativo,
                                     v_cod_band,
                                     v_mes_ref_import,
                                     v_ano_ref_import,
                                     sysdate);
           end if;
     end loop;
close sqlDados;
 commit;
exception
  when others then
    raise_application_error(-20001,'Ocorreu um erro - ' || SQLCODE ||' - ERRO- ' || SQLERRM);
end P_UNI_RESUMO;
/**/
PROCEDURE P_EXP_PLANO_SAUDE   (P_MES_REF      IN NUMBER,
                               P_ANO_REF   IN NUMBER,                               
                               P_TIPO      IN VARCHAR,
                               P_APAGA     IN VARCHAR,
                               P_CPF       IN VARCHAR)
as  
  SQLColaborador               sys_refcursor; 
   v_reccreatedon              varchar2(50);
   v_recmodifiedon             varchar2(50);
   
   /* Variavel do Colaborador */
  v_codigo_cpf               vw_mcw_colaborador.codigo_cpf%type;
  v_cod_funcao               vw_mcw_colaborador.cod_funcao%type;
  v_cod_depto                vw_mcw_colaborador.cod_depto%type; 
  v_salario_fixo             vw_mcw_colaborador.salario_fixo%type;
  v_chapa                    vw_mcw_colaborador.chapa%type;
  /**/
   v_RetiraCPF                          varchar(5); 
   /**************************************************/
   /*********** Select de todas empresas *************/
   /**************************************************/
   cursor SQLEmpresa is select a.cod_empresa,
                               a.codcoligada,
                               a.codfilial,
                               b.cod_band,
                               a.cod_empresa_matriz,
                               a.codcoligada_matriz,
                               a.codfilial_matriz
                       from gc.vw_mcw_empresas_mapa a
                        left outer join  tipo_bandeira b on (a.cod_band = b.cod_band)
                         where 1=1  
                          -- and a.processa_mapa = 'S'                       
                         and a.cod_band    in (select cod_band    from  tipo_bandeira       where processa = 'S')
                         and a.cod_empresa in (select cod_empresa from vw_mcw_empresas_mapa where processa = 'S')  
                          --and a.cod_empresa=39                                           
                        order by a.cod_empresa;
                        
   /* Variavel cursor sqlempresa */
   v_cod_empresa                      INTEGER;
   v_codcoligada                      INTEGER;
   v_codfilial                        INTEGER;
   /**/
   v_cod_empresa_matriz               INTEGER;
   v_codcoligada_matriz               INTEGER;
   v_codfilial_matriz                 INTEGER;
   v_cod_band                         INTEGER;
   
   /**************************************************/   
   /*************  Select do Lancamentos *************/
   /**************************************************/
   cursor SQLPlano is select nvl(sum(a.valor_consumo), 0) as total
                      from gc.vw_uni_resumo_colaborador a 
          where a.cod_empresa_matriz  = v_cod_empresa_matriz
            and a.codcoligada_matriz  = v_codcoligada_matriz
            and a.codfilial_matriz    = v_codfilial_matriz
            and a.mes_ref             = p_mes_ref
            and a.ano_ref             = p_ano_ref
            and a.exporta            = 'S'
            and a.export_totvs       = 'S' 
            --and a.codigo_cpf          = '5457067181'
            and a.codigo_cpf          = v_codigo_cpf;            
          
            v_planoSaude               vw_uni_resumo_colaborador.valor_liquido%type; 
         
   /**************************************************/   
   /*************  Select do Lancamentos datapag*************/
   /**************************************************/
   cursor SQLdatapagamento is select 
                               a.data_pag,                             
                               a.mescaixa
          from mcw_data_exportacao_totvs a 
            where a.cod_empresa = v_cod_empresa_matriz
            and a.codcoligada   = v_codcoligada_matriz
            and a.codfilial     = v_codfilial_matriz
            and a.mes_ref       = p_mes_ref
            and a.ano_ref       = p_ano_ref;
                     
          /* Variavel cursor  */         
         v_diapag             DATE;
         v_caixa              number(5);           
  
begin 
    /**/ 
    open SQLEmpresa;
    loop
      fetch SQLEmpresa into v_cod_empresa, 
                            v_codcoligada, 
                            v_codfilial, 
                            v_cod_band,
                            /**/
                            v_cod_empresa_matriz,
                            v_codcoligada_matriz, 
                            v_codfilial_matriz;                           
      exit when  SQLEmpresa%notfound;
           
      /**/     
      if P_CPF IS NULL then
         v_RetiraCPF :='---';
      else
          v_RetiraCPF :='';
      end if; 
        /**/ 
      /****************************************************/
      /*****************  Colaborador *********************/
      /****************************************************/
      open SQLColaborador for 'select a.codigo_cpf,
                                   a.cod_funcao,
                                   a.cod_depto,
                                   a.chapa
                            from gc.vw_mcw_colaborador a
                           where a.cod_empresa   = '||v_cod_empresa||'
                             and a.codcoligada   = '||v_codcoligada||'
                             and a.codfilial     = '||v_codfilial||'                          
                             and a.ativo         = ''S''                            
                             and a.situacao     in (''A'',''F'')
                             and a.export_totvs  = ''S''
                             and a.chapa is not null 
                             '||v_RetiraCPF||' and a.codigo_cpf = '''||p_cpf||'''  
                        order by a.colaborador';
      loop 
         v_salario_fixo :=0;
         fetch SQLColaborador into v_codigo_cpf,  
                                   v_cod_funcao,
                                   v_cod_depto,                                      
                                   v_chapa;
         exit when  SQLColaborador%notfound;
  /**/
  /**/     
      if  P_APAGA = 'S' then
      begin                     
    --delete from rm.pffinanc@rmteste
       delete from rm.pffinanc@dblrm
            where mescomp       = p_mes_ref
              and anocomp       = p_ano_ref
              and codcoligada   = v_codcoligada_matriz
              and chapa         = v_chapa     
              and tp            =  'U'
              and codevento     = '7611';           
              commit;
          end;      
      end if;       
         v_planoSaude            :=0;
         open SQLPlano;
            fetch SQLPlano into v_planoSaude;
   
         v_diapag               := '';         
         open SQLdatapagamento;                       
            fetch SQLdatapagamento into v_diapag,
                                        v_caixa;  
 
            if v_planoSaude > 0  then
                begin
                 update rm.pfperff@dblrm
                        set    reccreatedby   = 'LancAutomatico UNIMED. ',-- ||sysdate,
                               reccreatedon   = '',
                               recmodifiedby  = 'LancAutomatico UNIMED. ',--||sysdate,
                               recmodifiedon  = ''
                         where codcoligada    = v_codcoligada_matriz
                           and chapa          = v_chapa
                           and anocomp        = p_ano_ref
                           and mescomp        = p_mes_ref
                           and nroperiodo     = 4;  
                         /**/                 
                     if sql%rowcount = 0  then
                        --insert  into rm.pfperff@rmteste
                        insert into rm.pfperff@dblrm              
                              (codcoligada,
                               chapa,
                               anocomp,
                               mescomp,
                               nroperiodo,
                               mescaixacomum,                           
                               reccreatedby,
                               recmodifiedby,
                               reccreatedon,       
                               recmodifiedon)
                          values
                              (v_codcoligada,
                               v_chapa,
                               p_ano_ref,
                               p_mes_ref,
                               4,
                               v_caixa,
                               sysdate,      
                               sysdate, 
                               v_reccreatedon,
                               v_recmodifiedon);
                        end if;
                  /**/              
                --update rm.pffinanc@rmteste
                   update rm.pffinanc@dblrm                          
                         set valor          = v_planoSaude,
                             valororiginal  = v_planoSaude,    
                             reccreatedby   = 'LancAutomatico UNIMED' ||sysdate,
                             reccreatedon   = '',
                             recmodifiedby  = 'LancAutomatico UNIMED.' ||sysdate,
                             recmodifiedon  = '',
                             tp             = p_tipo,
                             data_lanc      = sysdate,
                             dtpagto        = v_diapag
                       where codcoligada    = v_codcoligada_matriz
                         and chapa          = v_chapa
                         and anocomp        = p_ano_ref
                         and mescomp        = p_mes_ref
                         and nroperiodo     = 4
                         and codevento      = '7611'; 
                     
               
                     
                   if sql%rowcount = 0  then
                   --insert  into rm.pffinanc@rmteste
                   insert into rm.pffinanc@dblrm            
                          (codcoligada,
                           chapa,
                           anocomp,
                           mescomp,
                           nroperiodo,
                           codevento,
                           dtpagto, 
                           hora,
                           ref,      
                           valor,
                           valororiginal, 
                           alteradomanual,            
                           reccreatedby,
                           recmodifiedby,
                           reccreatedon,       
                           recmodifiedon,
                           tp,
                           data_lanc)
                      values
                          (v_codcoligada_matriz,
                           v_chapa,
                           p_ano_ref,
                           p_mes_ref,
                           4,
                           '7611',
                           v_diapag,
                           0,
                           0.0,
                           v_planoSaude,
                           v_planoSaude,
                           0,
                           'LancAutomatico UNIMED ' ||sysdate,      
                           'LancAutomatico UNIMED ' ||sysdate, 
                           v_reccreatedon,
                           v_recmodifiedon,
                           p_tipo,
                           sysdate);
                     end if;              
                    
                    /**/                     
                        update gc.uni_resumo_colaborador a
                         set a.pg            = 'PG',
                         a.data_pg           = sysdate
                         where 1=1
                         and a.cod_empresa  = v_cod_empresa
                         and a.codcoligada  = v_codcoligada
                         and a.codfilial    = v_codfilial
                         and a.mes_ref      = p_mes_ref
                         and a.ano_ref      = p_ano_ref                       
                         and a.codigo_cpf   = v_codigo_cpf;
                        commit;
                    /**/
                end;                    
            end if;        
        commit;
          
          close SQLPlano;  
        
         close SQLdatapagamento;     
      end loop;
      close sqlColaborador;
      /**/    
    end loop;
    close SQLEmpresa;
    /**/ 
  commit;
  exception
  when others then
      raise_application_error(-20001,'An error was encountered - '||SQLCODE||' -ERROR- '||SQLERRM);
end P_EXP_PLANO_SAUDE;

end PKG_uni_saude;
