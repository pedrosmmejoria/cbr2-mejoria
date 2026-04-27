import React, { useState, useEffect, useMemo, useCallback } from 'react';

// ===========================================================
// Polyfill de window.storage usando localStorage del navegador.
// Imita la API que usaba el artifact original en claude.ai
// para no tener que reescribir las llamadas en el código.
// ===========================================================
if (typeof window !== 'undefined' && !window.storage) {
  window.storage = {
    get: async (key) => {
      const v = localStorage.getItem(key);
      return v === null ? null : { value: v };
    },
    set: async (key, value) => {
      localStorage.setItem(key, value);
      return true;
    },
    delete: async (key) => {
      localStorage.removeItem(key);
      return true;
    },
    list: async (prefix) => {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!prefix || k.startsWith(prefix)) keys.push(k);
      }
      return { keys };
    }
  };
}


// ===========================================================
// CBR 2.0 — Plataforma de preparación examen JTBR Panamá
// © Juan Sebastián Molina F. y Empresas Relacionadas
// Todos los derechos reservados.
// ===========================================================

const COLORS = {
  primary: '#1a3a5c', primaryLight: '#2c4f7a', primaryDark: '#0f2740',
  accent: '#c9a961', accentLight: '#e0c489',
  bg: '#f7f5f0', bgCard: '#ffffff', bgSoft: '#fbf9f4',
  border: '#e8e3d8', borderDark: '#d4cdb8',
  text: '#1a1a1a', textMuted: '#6b6b6b', textLight: '#9a9a9a',
  success: '#4a7c59', successBg: '#eef4ee',
  error: '#a04545', errorBg: '#faf0f0',
  warning: '#b8862c',
};

const SIGLAS = {
  'JTBR':'Junta Técnica de Bienes Raíces','CBR':'Corredor de Bienes Raíces',
  'MICI':'Ministerio de Comercio e Industrias','MIVIOT':'Ministerio de Vivienda y Ordenamiento Territorial',
  'MEF':'Ministerio de Economía y Finanzas','DGI':'Dirección General de Ingresos',
  'DGA':'Dirección General de Arrendamientos','SSNF':'Superintendencia de Sujetos No Financieros',
  'UAF':'Unidad de Análisis Financiero','GAFI':'Grupo de Acción Financiera Internacional',
  'PEP':'Persona Expuesta Políticamente','ROS':'Reporte de Operación Sospechosa',
  'SO':'Sujeto Obligado','DD':'Debida Diligencia','DDS':'Debida Diligencia Simplificada',
  'DDA':'Debida Diligencia Ampliada','DDD':'Debida Diligencia Documental',
  'KYC':'Know Your Customer (Conozca a su Cliente)',
  'ITBI':'Impuesto de Transferencia de Bienes Inmuebles','GC':'Ganancia de Capital',
  'PFT':'Patrimonio Familiar Tributario','VP':'Vivienda Principal','PH':'Propiedad Horizontal',
  'JD':'Junta Directiva','EP':'Escritura Pública','RP':'Registro Público',
  'CC':'Código Civil','CCo':'Código de Comercio','DL':'Decreto Ley','DE':'Decreto Ejecutivo',
  'ZLC':'Zona Libre de Colón','ZF':'Zona Franca','PP':'Panamá-Pacífico',
  'ANATI':'Autoridad Nacional de Administración de Tierras','INAC':'Instituto Nacional de Cultura',
  'OCA':'Oficina del Casco Antiguo','ATP':'Autoridad de Turismo de Panamá',
  'ASEP':'Autoridad Nacional de los Servicios Públicos','BNP':'Banco Nacional de Panamá',
  'FECI':'Fondo Especial de Compensación de Intereses','ISR':'Impuesto Sobre la Renta',
  'CSJ':'Corte Suprema de Justicia','VUCE':'Ventanilla Única de Comercio Exterior',
  'DMC':'Declaración de Movimiento Comercial','IDAAN':'Instituto de Acueductos y Alcantarillados Nacionales',
  'ACOBIR':'Asociación Panameña de Corredores y Promotores de Bienes Raíces',
};

const BLOCKS = [
  {id:1,name:"JTBR",full:"Junta Técnica de Bienes Raíces",count:30},
  {id:2,name:"Blanqueo",full:"Prevención de Blanqueo de Capitales",count:33},
  {id:3,name:"Arrendamiento",full:"Arrendamiento de Vivienda",count:34},
  {id:4,name:"Urbanismo",full:"Ordenamiento Territorial y Zonificación",count:34},
  {id:5,name:"Tierras",full:"Tierras del Estado y Casco Antiguo",count:35},
  {id:6,name:"Impuestos",full:"Impuestos y Crédito Inmobiliario",count:32},
  {id:7,name:"Zonas Especiales",full:"Zonas Francas y Áreas Especiales",count:35},
  {id:8,name:"PH y Turismo",full:"Propiedad Horizontal y Turismo",count:42},
  {id:9,name:"Contratos",full:"Contratos Inmobiliarios",count:40},
  {id:10,name:"Cálculos",full:"Cálculos Tributarios e Inmobiliarios",count:12},
];

const QUESTIONS = [
{id:1,block:1,topic:"Definición CBR",q:"¿Cómo define el Decreto Ley 6 de 1999 al Corredor de Bienes Raíces (CBR)?",ctx:"El DL 6/1999 es la norma base que crea y regula la profesión del corredor en Panamá.",o:["Persona natural o jurídica que se desempeña habitual y profesionalmente como mediador entre el propietario y terceros para venta o arrendamiento","Persona panameña con licencia comercial que vende propiedades","Profesional certificado por la Cámara de Comercio","Persona con más de 5 años de experiencia inmobiliaria"],a:0,exp:"Art. 1 del DL 6/1999. La mediación habitual y profesional es el elemento clave: no basta con vender una vez, debe ser actividad permanente y profesional."},
{id:2,block:1,topic:"Fianza",q:"¿Cuál es el monto de la fianza para obtener licencia de Corredor de Bienes Raíces?",o:["B/.5,000 más timbres","B/.10,000 más timbres de B/.25","B/.15,000 más timbres","B/.20,000 más timbres de B/.50"],a:1,exp:"Art. 7 del DL 6/1999. La fianza de B/.10,000 con timbres de B/.25 es requisito obligatorio. Esta fianza garantiza el cumplimiento de las obligaciones del corredor frente a clientes y autoridades."},
{id:3,block:1,topic:"Extranjeros",q:"¿Qué requisito adicional debe cumplir un extranjero para ser CBR?",o:["Tener pasaporte vigente","Tener visa de trabajo","Tener mínimo 5 años de residencia permanente en Panamá","Estar casado con panameño"],a:2,exp:"Art. 4 del DL 6/1999. Un extranjero requiere mínimo 5 años de residencia permanente. Esto busca asegurar arraigo y conocimiento del mercado local."},
{id:4,block:1,topic:"Eximido del examen",q:"¿Quién puede ser eximido del examen de CBR?",o:["Quien tenga título universitario en derecho","Quien haya ejercido el corretaje por mínimo 10 años continuos","Quien sea panameño por nacimiento","Quien tenga maestría en bienes raíces"],a:1,exp:"Art. 6 del DL 6/1999. Diez años de ejercicio continuo eximen del examen. La experiencia práctica equivale a la evaluación teórica."},
{id:5,block:1,topic:"Plazo licencia",q:"¿En cuántos días la JTBR debe expedir la licencia desde la solicitud?",o:["15 días hábiles","20 días hábiles","30 días hábiles","45 días hábiles"],a:2,exp:"Art. 8 del DL 6/1999. Treinta (30) días hábiles desde la solicitud completa."},
{id:6,block:1,topic:"Reconsideración",q:"¿Qué plazo hay para presentar recurso de reconsideración ante la JTBR?",o:["5 días hábiles","10 días hábiles","15 días hábiles","30 días hábiles"],a:1,exp:"DE 39/2001. Diez (10) días hábiles para presentar reconsideración contra cualquier decisión de la JTBR."},
{id:7,block:1,topic:"Suspensión",q:"¿Cuál es el plazo máximo de suspensión de licencia y plazo para reinstalación?",o:["3 meses suspensión / 6 meses reinstalación","6 meses suspensión / 1 año reinstalación","1 año suspensión / 2 años reinstalación","Indefinida / a discreción de la JTBR"],a:1,exp:"Art. 22 del DL 6/1999. Suspensión hasta 6 meses; reinstalación hasta 1 año."},
{id:8,block:1,topic:"Composición",q:"¿De cuántos miembros se compone la JTBR?",ctx:"La JTBR es el órgano regulador del corretaje en Panamá. Su composición refleja el tripartismo público-privado.",o:["3 miembros","4 miembros","5 miembros","7 miembros"],a:2,exp:"Art. 9 del DL 6/1999. Cinco miembros: el MICI (que la preside), el MIVIOT, el MEF y dos representantes gremiales (típicamente de ACOBIR y UNACOBIN)."},
{id:9,block:1,topic:"Quién preside",q:"¿Qué Ministerio preside la JTBR?",o:["MIVIOT","MICI","MEF","Ministerio de la Presidencia"],a:1,exp:"Art. 10 del DL 6/1999. El MICI preside la JTBR. Esto es coherente con que la JTBR está adscrita al MICI."},
{id:10,block:1,topic:"Período gremiales",q:"¿Cuál es el período de los miembros gremiales en la JTBR?",o:["1 año","2 años","3 años","5 años"],a:2,exp:"Art. 9 del DL 6/1999. Tres años para miembros gremiales."},
{id:11,block:1,topic:"Reuniones",q:"¿Con qué frecuencia se reúne la JTBR?",o:["Semanal","Quincenal","Mensual","Trimestral"],a:2,exp:"Art. 11 del DL 6/1999. Reuniones mensuales ordinarias."},
{id:12,block:1,topic:"Quórum",q:"¿Cuál es el quórum mínimo de la JTBR?",o:["2 miembros","3 miembros","4 miembros","La totalidad"],a:1,exp:"Art. 11 del DL 6/1999. Quórum de 3 miembros para sesionar válidamente."},
{id:13,block:1,topic:"Multas",q:"¿Cuál es el rango de multas que puede imponer la JTBR?",o:["B/.50 a B/.5,000","B/.100 a B/.10,000","B/.500 a B/.50,000","B/.1,000 a B/.100,000"],a:1,exp:"Art. 21 del DL 6/1999. Multas entre B/.100 y B/.10,000 según gravedad."},
{id:14,block:1,topic:"Sin licencia",q:"¿Cuál es la sanción por ejercer el corretaje sin licencia?",o:["B/.5,000","B/.10,000","B/.25,000","B/.50,000"],a:1,exp:"Art. 21 del DL 6/1999. Multa máxima de B/.10,000 por ejercicio sin licencia."},
{id:15,block:1,topic:"Cancelación",q:"¿Por cuánto tiempo puede cancelarse la licencia de CBR?",o:["6 meses a 1 año","1 año a 5 años","1 año a 10 años","Cancelación definitiva siempre"],a:2,exp:"Art. 22 del DL 6/1999. Cancelación de 1 a 10 años según gravedad."},
{id:16,block:1,topic:"Régimen transitorio",q:"¿Cuál fue el plazo del régimen transitorio del DL 6/1999?",o:["3 meses","6 meses","1 año","2 años"],a:1,exp:"Disposición transitoria del DL 6/1999. Seis meses para que los corredores en ejercicio se adecuaran a la nueva normativa."},
{id:17,block:1,topic:"Derecho supletorio",q:"¿Qué Código rige supletoriamente al Decreto Ley 6/1999?",ctx:"PREGUNTA TRAMPA TÍPICA: muchos contestan Código Civil por costumbre, pero la respuesta correcta es otra.",o:["Código Civil","Código de Comercio","Código Administrativo","Código Procesal Civil"],a:1,exp:"Art. 19 del DL 6/1999. El Código de Comercio (CCo) rige supletoriamente, NO el Código Civil. La razón: el corretaje es actividad mercantil. Ojo con esta pregunta de trampa."},
{id:18,block:1,topic:"Impedimentos",q:"¿Cuál es el grado de parentesco que constituye impedimento en la JTBR?",o:["2° consanguinidad / 1° afinidad","3° consanguinidad / 2° afinidad","4° consanguinidad / 2° afinidad","4° consanguinidad / 4° afinidad"],a:2,exp:"DE 39/2001. Cuarto grado consanguinidad y segundo de afinidad."},
{id:19,block:1,topic:"Plazo impedimento",q:"¿En cuántos días debe el miembro manifestar su impedimento?",o:["1 día","2 días","5 días","10 días"],a:1,exp:"DE 39/2001. Dos días para manifestar impedimento."},
{id:20,block:1,topic:"Pronunciamiento",q:"¿En cuántos días debe pronunciarse la JTBR sobre un impedimento?",o:["2 días","3 días","5 días","10 días"],a:1,exp:"DE 39/2001. Tres días para pronunciarse."},
{id:21,block:1,topic:"Descargo",q:"¿Cuál es el plazo para presentar descargo a una denuncia ante la JTBR?",o:["5 días","10 días","15 días","30 días"],a:1,exp:"DE 39/2001. Diez días para presentar descargo desde la notificación."},
{id:22,block:1,topic:"Resolución denuncia",q:"¿En cuánto tiempo debe la JTBR emitir resolución sobre una denuncia?",o:["1 mes","2 meses","3 meses","6 meses"],a:1,exp:"DE 39/2001. Dos meses para emitir resolución."},
{id:23,block:1,topic:"Código Ética",q:"¿Qué Resolución contiene el Código de Ética del CBR?",o:["Resolución 1/2001","Resolución 2/2001","Resolución 6/2004","Resolución 39/2001"],a:1,exp:"Resolución 2 de 2001 de la JTBR establece el Código de Ética."},
{id:24,block:1,topic:"Resolución 6/2004",q:"¿Qué regula la Resolución 6 de 2004 de la JTBR?",o:["Tarifas de comisiones","Procedimiento del examen","Avalúos y peritajes","Régimen sancionador"],a:2,exp:"Resolución 6/2004 regula avalúos y peritajes inmobiliarios."},
{id:25,block:1,topic:"Resolución 1/2001",q:"¿Qué establece la Resolución 1 de 2001 de la JTBR?",o:["Procedimiento del examen de idoneidad","Código de Ética","Avalúos","Sanciones"],a:0,exp:"Resolución 1/2001 establece el procedimiento del examen de idoneidad."},
{id:26,block:1,topic:"DE 39/2001",q:"¿Qué reglamenta el Decreto Ejecutivo 39 de 2001?",o:["Código de Ética","El DL 6 de 1999 sobre la JTBR","Los avalúos","La Ley de Blanqueo"],a:1,exp:"DE 39/2001 reglamenta el DL 6/1999 desarrollando los procedimientos administrativos de la JTBR."},
{id:27,block:1,topic:"PJ requisitos",q:"Para que una persona jurídica obtenga licencia de CBR, ¿qué requisito clave debe cumplir?",o:["Tener mínimo 3 socios","Que su representante legal sea CBR con licencia vigente","Tener capital mínimo de B/.50,000","Estar inscrita en la Cámara de Comercio"],a:1,exp:"DL 6/1999. El representante legal debe ser CBR con licencia vigente."},
{id:28,block:1,topic:"Contabilidad",q:"¿Conforme a qué norma debe el CBR llevar su contabilidad?",o:["Art. 75 del Código de Comercio","Código Civil","Ley de Contabilidad","Reglamento JTBR"],a:0,exp:"Art. 17 del DL 6/1999 remite al Art. 75 del Código de Comercio (CCo)."},
{id:29,block:1,topic:"Vigencia",q:"La licencia de CBR es:",o:["Anual y debe renovarse cada año","Permanente mientras se cumplan las obligaciones","Vigente por 5 años renovables","Vigente por 10 años"],a:1,exp:"DL 6/1999. La licencia es permanente sujeta al cumplimiento continuo de obligaciones."},
{id:30,block:1,topic:"No función",q:"¿Cuál NO es función de la JTBR?",o:["Otorgar licencias","Aplicar examen de idoneidad","Fijar las comisiones del mercado","Sancionar incumplimientos"],a:2,exp:"Las comisiones NO están fijadas por ley ni por la JTBR. Las determina el mercado libremente (típicamente 3-5%)."},
{id:31,block:2,topic:"Objeto Ley 23/2015",q:"¿Cuál es el objeto principal de la Ley 23 de 2015?",o:["Crear la JTBR","Adoptar medidas para prevenir el blanqueo de capitales, financiamiento del terrorismo y de la proliferación de armas de destrucción masiva","Regular las zonas francas","Establecer impuestos inmobiliarios"],a:1,exp:"Art. 1 Ley 23/2015. Prevención de blanqueo, financiamiento del terrorismo y financiamiento de proliferación de armas (BL/FT/FPADM)."},
{id:32,block:2,topic:"Comisión Nacional",q:"¿Cuántos miembros tiene la Comisión Nacional contra el Blanqueo (Ley 254/2021)?",o:["7","8","9","11"],a:2,exp:"Ley 254/2021. Nueve miembros (antes eran 8). Cambio importante."},
{id:33,block:2,topic:"Quórum",q:"¿Cuál es el quórum de la Comisión Nacional?",o:["3 miembros","4 miembros","5 miembros","Mayoría absoluta"],a:2,exp:"Ley 254/2021. Cinco miembros para sesionar; las decisiones se toman con 5 votos a favor."},
{id:34,block:2,topic:"Reuniones",q:"¿Cuántas reuniones mínimas al año debe tener la Comisión Nacional?",o:["2","4","6","Mensuales"],a:1,exp:"Ley 254/2021. Mínimo cuatro reuniones al año."},
{id:35,block:2,topic:"Supervisor SNF",q:"¿Cuál es el supervisor de los Sujetos Obligados No Financieros bajo Ley 124/2020?",ctx:"PREGUNTA TRAMPA: muchos confunden Intendencia con Superintendencia.",o:["Intendencia de Sujetos no Financieros","Superintendencia de Sujetos no Financieros (SSNF)","UAF directamente","MEF"],a:1,exp:"Ley 124/2020. Es la SSNF. NO es 'Intendencia'. Cambio importante."},
{id:36,block:2,topic:"Categorías SO",q:"¿Cuántas categorías de SO No Financieros existen bajo el Art. 40 de la Ley 124/2020?",o:["10","11","13","15"],a:2,exp:"Art. 40 Ley 124/2020. Trece (13) categorías de Sujetos Obligados No Financieros."},
{id:37,block:2,topic:"CBR como SO",q:"¿En qué numeral del Art. 40 de la Ley 124/2020 figura el CBR?",o:["Numeral 1","Numeral 2","Numeral 3","Numeral 5"],a:2,exp:"Numeral 3 del Art. 40 Ley 124/2020 incluye al CBR como Sujeto Obligado."},
{id:38,block:2,topic:"Umbral efectivo",q:"¿Cuál es el umbral para reportar operaciones en efectivo?",o:["B/.5,000","B/.7,500","B/.10,000","B/.25,000"],a:2,exp:"Ley 23/2015. Diez mil balboas o más en efectivo deben reportarse."},
{id:39,block:2,topic:"ROS sin umbral",q:"¿Existe umbral para los Reportes de Operaciones Sospechosas?",o:["B/.10,000","B/.25,000","B/.50,000","No tienen umbral, se reportan independiente del monto"],a:3,exp:"Ley 23/2015. Los ROS se reportan SIN umbral. Lo que activa el reporte es la sospecha, no el monto. Una operación de B/.500 puede ser ROS si hay indicios."},
{id:40,block:2,topic:"Resguardo",q:"¿Por cuántos años deben resguardarse los documentos de Debida Diligencia?",o:["3 años","5 años","7 años","10 años"],a:1,exp:"Ley 23/2015. Cinco años mínimo desde que finaliza la relación con el cliente."},
{id:41,block:2,topic:"Actualización alto riesgo",q:"¿Con qué frecuencia se actualiza la información de clientes de alto riesgo?",o:["Cada 6 meses","Cada año","Cada 2 años","Cada 5 años"],a:1,exp:"Ley 23/2015. Anual para clientes de alto riesgo."},
{id:42,block:2,topic:"PEP cese",q:"¿Hasta cuándo se considera Persona Expuesta Políticamente luego del cese del cargo?",o:["6 meses","1 año","2 años","5 años"],a:2,exp:"Ley 23/2015. Hasta 2 años después del cese del cargo público."},
{id:43,block:2,topic:"Familiares PEP",q:"¿Quiénes son considerados familiares cercanos de un PEP?",o:["Toda la familia hasta 4° grado","Cónyuge, padres, hermanos e hijos","Solo cónyuge e hijos","Cónyuge, padres, hijos y suegros"],a:1,exp:"Ley 23/2015. Cónyuge, padres, hermanos e hijos del PEP requieren DDA."},
{id:44,block:2,topic:"Sanciones",q:"¿Cuál es el rango de sanciones bajo la Ley 254/2021?",o:["B/.1,000 a B/.1,000,000","B/.5,000 a B/.5,000,000","B/.10,000 a B/.10,000,000","B/.500 a B/.500,000"],a:1,exp:"Ley 254/2021. Sanciones de B/.5,000 a B/.5,000,000."},
{id:45,block:2,topic:"JD SSNF",q:"¿Cuántos directores tiene la Junta Directiva de la SSNF?",o:["3","5","7","9"],a:1,exp:"Ley 124/2020. Cinco directores."},
{id:46,block:2,topic:"Congelamiento",q:"¿Qué autoridad ordena el congelamiento de fondos?",o:["UAF","Sala Segunda Penal de la Corte Suprema","MEF","SSNF"],a:1,exp:"Ley 23/2015. Sala II de lo Penal de la CSJ. La UAF analiza, pero el congelamiento lo ordena la sala penal."},
{id:47,block:2,topic:"DD PN",q:"¿Qué documentos clave requiere la DD para persona natural?",o:["Cédula, comprobante de domicilio, profesión u ocupación","Solo cédula","Cédula y referencias bancarias","Cédula, ingresos y declaración jurada"],a:0,exp:"Ley 23/2015 num. 2,3,4 para PN: identificación oficial, comprobante de domicilio y ocupación."},
{id:48,block:2,topic:"DD PJ",q:"¿Qué requiere la DD para persona jurídica?",o:["Pacto social, certificado del RP, beneficiario final","Solo Pacto Social","RUC y aviso de operación","Solo certificado del Registro Público"],a:0,exp:"Ley 23/2015 num. 1,2,3,8 para PJ: Pacto Social, certificado del RP vigente y beneficiario final."},
{id:49,block:2,topic:"Beneficiario Final",q:"¿Qué se entiende por Beneficiario Final?",o:["Quien recibe el dinero","Persona natural que ejerce control efectivo de la PJ o se beneficia de la operación","El representante legal","Cualquier socio con acciones"],a:1,exp:"Ley 23/2015. Persona natural con control efectivo (típicamente >25%). NO es el representante legal automáticamente."},
{id:50,block:2,topic:"DDD",q:"¿Qué significa DDD?",o:["Debida Diligencia Documental","Debida Diligencia Definitiva","Diligencia Debida Diferenciada","Debida Diligencia Doble"],a:0,exp:"Ley 23/2015. DDD = Debida Diligencia Documental."},
{id:51,block:2,topic:"DDA",q:"¿Qué es la DDA?",o:["Diligencia ante Autoridad","Debida Diligencia Ampliada","Debida Diligencia Asegurada","Diligencia Auxiliar"],a:1,exp:"Ley 23/2015. DDA = Debida Diligencia Ampliada para clientes de alto riesgo (PEP, países de alto riesgo, etc.)."},
{id:52,block:2,topic:"DDS",q:"¿Qué es la DDS?",o:["Debida Diligencia Simplificada","Diligencia Doble Sumaria","Doble Debida Sustantiva","Debida Diligencia Sectorial"],a:0,exp:"Ley 23/2015. DDS = Debida Diligencia Simplificada para clientes de bajo riesgo."},
{id:53,block:2,topic:"Reglamento",q:"¿Qué Decreto reglamenta la Ley 23/2015?",o:["DE 363 de 2015","DE 39 de 2001","DE 50 de 2019","DE 228 de 2023"],a:0,exp:"Decreto Ejecutivo 363 de 2015 reglamenta la Ley 23/2015."},
{id:54,block:2,topic:"UAF",q:"¿Qué es la UAF?",o:["Unidad de Análisis Financiero","Unidad Antifraude","Unidad de Auditoría","Unidad Aduanera y Financiera"],a:0,exp:"UAF = Unidad de Análisis Financiero. Recibe los Reportes de Operaciones Sospechosas y los analiza."},
{id:55,block:2,topic:"KYC",q:"¿Qué es la política 'Conozca a su Cliente' (KYC)?",o:["Política comercial","Política para identificar y verificar identidad y origen de fondos del cliente","Política de marketing","Política de fidelización"],a:1,exp:"Know Your Customer. Identificación, verificación de identidad y origen de los fondos."},
{id:56,block:2,topic:"Quien hace DD",q:"¿Quién está obligado a realizar DD a sus clientes?",o:["Solo bancos","Todos los SO Financieros y No Financieros","Solo abogados","Solo CBR con más de 5 años"],a:1,exp:"Ley 23/2015. Todos los Sujetos Obligados, financieros y no financieros."},
{id:57,block:2,topic:"Niveles riesgo",q:"¿Cuáles son los niveles de riesgo del cliente?",o:["Solo dos: alto y bajo","Bajo, medio y alto","Cinco niveles","Solo riesgo PEP"],a:1,exp:"Ley 23/2015. Tres niveles: bajo, medio y alto."},
{id:58,block:2,topic:"Plazo ROS",q:"¿En qué plazo se reporta un ROS a la UAF?",o:["Inmediatamente al detectar la sospecha","30 días","90 días","Cuando el cliente lo pida"],a:0,exp:"Ley 23/2015. Inmediato al detectar la sospecha. La demora es sancionable."},
{id:59,block:2,topic:"Alcance",q:"La Ley 23/2015 también previene:",o:["Solo blanqueo","Blanqueo, financiamiento del terrorismo y proliferación de armas de destrucción masiva","Solo terrorismo","Lavado y narcotráfico solamente"],a:1,exp:"Ley 23/2015. BL/FT/FPADM."},
{id:60,block:2,topic:"Riesgo geográfico",q:"¿Qué constituye un factor de riesgo geográfico?",o:["Cliente con domicilio rural","Cliente o transacción vinculada a país no cooperante o de alto riesgo","Cliente extranjero por sí solo","Cliente con segunda residencia"],a:1,exp:"Ley 23/2015. País de alto riesgo o no cooperante (listas GAFI). Ser extranjero por sí solo NO es factor de riesgo."},
{id:61,block:2,topic:"Manual",q:"¿Qué debe tener todo CBR como Sujeto Obligado?",o:["Solo registros contables","Manual de prevención de blanqueo y oficial de cumplimiento","Solo licencia vigente","Únicamente cuenta bancaria"],a:1,exp:"Ley 23/2015. Manual de prevención y un Oficial de Cumplimiento."},
{id:62,block:2,topic:"Sancionables",q:"¿Quiénes pueden ser sancionados por incumplimiento?",o:["Solo el CBR persona natural","SO, directivos, gerentes, ejecutivos y empleados responsables","Solo el oficial de cumplimiento","Únicamente el representante legal"],a:1,exp:"Ley 23/2015. Sanciones a todos los responsables."},
{id:63,block:2,topic:"GAFI",q:"¿Qué es GAFI?",o:["Grupo Anticorrupción Internacional","Grupo de Acción Financiera Internacional","Gerencia de Actividades Financieras","Gestión Anti Fraude Inmobiliario"],a:1,exp:"Grupo de Acción Financiera Internacional. Establece estándares globales contra el blanqueo."},
{id:64,block:3,topic:"Carácter",q:"¿Cuál es el carácter de la Ley 93 de 1973 sobre arrendamiento?",o:["Dispositivo (las partes pueden modificar)","De orden público","Supletorio","Mercantil"],a:1,exp:"Ley 93/1973. De orden público, irrenunciable. Las partes no pueden pactar cláusulas que vulneren los derechos protegidos."},
{id:65,block:3,topic:"Excluidos",q:"¿Qué arrendamientos NO se rigen por la Ley 93/1973?",o:["Vivienda urbana","Hoteles, moteles, pensiones, aparta-hoteles, alquileres de temporada menores a 6 meses","Vivienda comercial","Vivienda en PH"],a:1,exp:"Art. 4 Ley 93/1973. Estancias temporales bajo 6 meses están excluidas."},
{id:66,block:3,topic:"Forma",q:"¿En qué forma debe celebrarse el contrato de arrendamiento de vivienda?",o:["Verbal es válido","Por escrito en formato del MIVIOT-DGA","Solo en escritura pública","Por correo electrónico"],a:1,exp:"Ley 93/1973. Por escrito, en formato aprobado por el MIVIOT a través de la DGA."},
{id:67,block:3,topic:"Copia DGA",q:"¿En cuántos días debe presentarse copia del contrato a la DGA?",o:["3 días hábiles","5 días hábiles","10 días hábiles","30 días"],a:1,exp:"Ley 93/1973. Cinco días hábiles a la Dirección General de Arrendamientos."},
{id:68,block:3,topic:"Plazo mínimo",q:"¿Cuál es el plazo mínimo del contrato de arrendamiento?",o:["1 año","2 años con prórroga","3 años más prórroga","5 años"],a:2,exp:"Ley 93/1973. Tres años más prórroga. Da estabilidad al arrendatario."},
{id:69,block:3,topic:"Aviso",q:"¿Cuál es el plazo mínimo de aviso del arrendatario para desocupar?",o:["15 días","30 días calendario","60 días","90 días"],a:1,exp:"Ley 93/1973. Treinta días calendario de aviso previo."},
{id:70,block:3,topic:"Pago canon",q:"¿Cuándo se paga el canon de arrendamiento?",o:["Por adelantado","Mes vencido","Quincenal","Trimestral"],a:1,exp:"Ley 93/1973. Por mes vencido. No se puede exigir pago por adelantado."},
{id:71,block:3,topic:"Depósito",q:"¿A cuánto equivale el depósito de garantía bajo la Ley 259/2021?",ctx:"La Ley 259/2021 modificó importantes aspectos del régimen anterior.",o:["Medio mes","Un canon de arrendamiento","Dos cánones","Tres cánones"],a:1,exp:"Ley 259/2021 modificó la regla anterior: depósito = un canon."},
{id:72,block:3,topic:"Manejo depósito",q:"¿Dónde se deposita la garantía de arrendamiento?",ctx:"PREGUNTA IMPORTANTE: muchos creen que va al MIVIOT, pero la Ley 259/2021 lo cambió.",o:["Cuenta del arrendador","MIVIOT","Banco Nacional de Panamá o Caja de Ahorros","Notaría"],a:2,exp:"Ley 259/2021. BNP o Caja de Ahorros. NO va al MIVIOT (eso era antes)."},
{id:73,block:3,topic:"Preferencia PH",q:"¿En cuántos días tiene preferencia el arrendatario para comprar cuando el arrendador venda en PH?",o:["30 días","60 días","90 días","6 meses"],a:2,exp:"Art. 16 Ley 93/1973. Noventa días de preferencia (derecho de tanteo)."},
{id:74,block:3,topic:"Subrogación",q:"En caso de muerte del arrendatario, ¿hasta qué grado puede subrogarse familiar?",o:["1° consanguinidad","2° consanguinidad","3° consanguinidad","4° consanguinidad"],a:3,exp:"Ley 93/1973. Cuarto grado de consanguinidad."},
{id:75,block:3,topic:"Mora",q:"¿Cuántos meses de mora habilitan al lanzamiento?",o:["1 mes","2 meses","3 meses","6 meses"],a:1,exp:"Ley 93/1973. Dos meses de mora habilitan el procedimiento de lanzamiento administrativo."},
{id:76,block:3,topic:"Comisión Vivienda",q:"¿En cuántos días hábiles debe la Comisión de Vivienda resolver desahucio?",o:["10 días","15 días hábiles","30 días","60 días"],a:1,exp:"Ley 93/1973. Quince días hábiles."},
{id:77,block:3,topic:"Comercial",q:"¿Quién resuelve los conflictos de arrendamiento comercial?",o:["MIVIOT","Comisión de Vivienda","Jurisdicción ordinaria","JTBR"],a:2,exp:"Comercial: jurisdicción ordinaria (tribunales civiles). Vivienda: Comisión de Vivienda. Distinción crítica."},
{id:78,block:3,topic:"Uso propio",q:"¿Hasta qué grado familiar permite el desahucio para uso propio?",o:["1° consanguinidad","2° consanguinidad","3° consanguinidad","4° consanguinidad"],a:2,exp:"Ley 93/1973. Tercer grado de consanguinidad."},
{id:79,block:3,topic:"Multa fraude",q:"¿Cuál es la multa por desahucio fraudulento?",o:["B/.500","B/.1,500","B/.5,000","B/.10,000"],a:1,exp:"Ley 93/1973. Multa de B/.1,500."},
{id:80,block:3,topic:"Desocupación",q:"En desahucio para uso propio, ¿cuánto tiempo dan al arrendatario?",o:["15 días","1 mes","2 meses","3 meses"],a:1,exp:"Ley 93/1973. Un mes."},
{id:81,block:3,topic:"Indemnización",q:"¿Cuántos meses de canon debe pagar el arrendador en desahucio?",o:["3 meses (mín 1, máx 6)","12 meses (mín 1, máx 6)","6 meses fijos","2 meses"],a:1,exp:"Ley 93/1973. Doce meses, mínimo 1, máximo 6 según determine la Comisión."},
{id:82,block:3,topic:"Prohibición",q:"Tras desahucio por uso propio, ¿por cuánto tiempo no puede arrendar el arrendador?",o:["1 año","2 años","5 años","Nunca más"],a:1,exp:"Ley 93/1973. Dos años de prohibición."},
{id:83,block:3,topic:"Comisión miembros",q:"¿De cuántos miembros se compone la Comisión de Vivienda?",o:["3 miembros","5 miembros","7 miembros","9 miembros"],a:0,exp:"Ley 93/1973. Tres miembros, con reuniones semanales."},
{id:84,block:3,topic:"Multas DGA",q:"¿Cuál es el rango de multas de la DGA?",o:["B/.5 a B/.500","B/.10 a B/.1,000 más arresto 30-90 días","B/.50 a B/.5,000","B/.100 a B/.10,000"],a:1,exp:"Ley 93/1973. B/.10 a B/.1,000 más arresto de 30 a 90 días en casos graves."},
{id:85,block:3,topic:"Cambios 259",q:"¿Qué modificó principalmente la Ley 259 de 2021?",o:["Plazo del contrato","El depósito y manejo en BNP/Caja de Ahorros","Las multas","La preferencia de compra"],a:1,exp:"Ley 259/2021. Modificó el depósito a un canon y obligó a depositarlo en BNP o Caja de Ahorros."},
{id:86,block:3,topic:"Renta congelada",q:"¿Para qué viviendas existió control de canon (renta congelada)?",o:["Todas las viviendas","Cánones bajos hasta cierto monto, según ley","Solo vivienda PH","Solo arrendamiento comercial"],a:1,exp:"Ley 93/1973. Cánones bajo cierto umbral con control gubernamental."},
{id:87,block:3,topic:"Aumento",q:"¿Cómo se autoriza el aumento del canon en vivienda controlada?",o:["Libremente por el arrendador","Mediante autorización de la DGA","Cada 5 años","Solo por inflación"],a:1,exp:"Ley 93/1973. La DGA autoriza el aumento."},
{id:88,block:3,topic:"Fianza obligatoria",q:"¿Es obligatoria la fianza en arrendamiento residencial bajo Ley 259/2021?",o:["Sí, equivale a un canon","No es obligatoria","Solo en comercial","Solo si lo pide el banco"],a:0,exp:"Ley 259/2021. Depósito de un canon, en banco autorizado."},
{id:89,block:3,topic:"DGA sigla",q:"¿Qué significa DGA?",o:["Dirección General de Arrendamientos","Departamento de Gestión Administrativa","Defensoría de la Garantía Arrendaticia","Dirección Gubernamental Arrendamiento"],a:0,exp:"Dirección General de Arrendamientos del MIVIOT."},
{id:90,block:3,topic:"Quien resuelve",q:"¿Quién resuelve disputas en arrendamiento residencial controlado?",o:["Tribunal Civil","Comisión de Vivienda","JTBR","Notaría"],a:1,exp:"Comisión de Vivienda en residencial. Tribunal civil en comercial."},
{id:91,block:3,topic:"Procedimiento mora",q:"¿Cuál es el procedimiento contra inquilino con 2+ meses de mora?",o:["Lanzamiento administrativo","Demanda civil únicamente","Cobro extrajudicial solo","Notificación notarial"],a:0,exp:"Ley 93/1973. Lanzamiento administrativo."},
{id:92,block:3,topic:"Recibo",q:"¿Es obligación del arrendador entregar recibo?",o:["No","Sí, por cada pago","Solo si lo pide el arrendatario","Solo en pagos en efectivo"],a:1,exp:"Ley 93/1973. Recibo obligatorio."},
{id:93,block:3,topic:"Reparaciones mayores",q:"¿Quién paga las reparaciones mayores estructurales?",o:["Arrendatario siempre","Arrendador (estructurales)","Mitad cada uno","Dueño del edificio"],a:1,exp:"Ley 93/1973 + CC. Reparaciones estructurales: arrendador."},
{id:94,block:3,topic:"Reparaciones menores",q:"¿Quién paga las reparaciones menores y de uso?",o:["Arrendador","Arrendatario","Comisión de Vivienda","DGA"],a:1,exp:"Reparaciones de uso ordinario: arrendatario."},
{id:95,block:3,topic:"Cesión",q:"¿Puede el arrendatario ceder el arrendamiento?",o:["Libremente","Solo con autorización del arrendador","Nunca","Solo si está hipotecado"],a:1,exp:"Ley 93/1973. Solo con autorización expresa."},
{id:96,block:3,topic:"Subarriendo",q:"¿Es válido el subarriendo?",o:["Sí, libremente","Solo con consentimiento expreso del arrendador","Nunca","Solo en comercial"],a:1,exp:"Ley 93/1973. Solo con consentimiento expreso."},
{id:97,block:3,topic:"Causales",q:"¿Cuáles son causales de terminación del contrato?",o:["Solo vencimiento","Vencimiento, mora, uso indebido, daños","Solo decisión del arrendador","Solo decisión del arrendatario"],a:1,exp:"Ley 93/1973. Múltiples causales tipificadas."},
{id:98,block:4,topic:"Objeto",q:"¿Cuál es el objeto de la Ley 6 de 2006?",o:["Crear municipios","Reglamentar el ordenamiento territorial para el desarrollo urbano","Regular zonas francas","Crear la JTBR"],a:1,exp:"Art. 1 Ley 6/2006. Ordenamiento territorial nacional."},
{id:99,block:4,topic:"Acción urbanística",q:"¿Qué incluye la acción urbanística?",o:["Solo edificación","Parcelación, urbanización y edificación","Solo planos","Solo zonificación"],a:1,exp:"Art. 3 Ley 6/2006. Tres componentes integrados."},
{id:100,block:4,topic:"Tipos planes",q:"¿Cuántos tipos de planes de ordenamiento existen?",o:["2","3","4 (nacional, regional, local, parcial)","5"],a:2,exp:"Ley 6/2006. Cuatro tipos: nacional, regional, local y parcial."},
{id:101,block:4,topic:"Plan local",q:"¿En qué casos es obligatorio el plan local de ordenamiento?",o:["En todos los municipios","Distritos con población mayor a 25,000 habitantes","Solo capitales de provincia","Solo distritos costeros"],a:1,exp:"Ley 6/2006. Más de 25,000 habitantes."},
{id:102,block:4,topic:"Multas",q:"¿Cuál es el rango de multas por infracción urbanística?",o:["B/.10 a B/.10,000","B/.50 a B/.100,000","B/.100 a B/.50,000","B/.500 a B/.500,000"],a:1,exp:"Ley 6/2006. B/.50 a B/.100,000."},
{id:103,block:4,topic:"Revisión",q:"¿Cada cuánto deben revisarse los planes de ordenamiento?",o:["Cada año","Cada 3 años","Cada 5 años","Cada 10 años"],a:2,exp:"Ley 6/2006. Cada 5 años."},
{id:104,block:4,topic:"Junta Planif",q:"¿De cuántos miembros se compone la Junta de Planificación Municipal?",o:["3","4","5","7"],a:1,exp:"Ley 6/2006. Cuatro miembros."},
{id:105,block:4,topic:"R-R",q:"¿Cuál es la densidad máxima en zona R-R (Residencial Rural)?",ctx:"Las densidades residenciales son del Decreto MIVIOT 169-2004.",o:["50 personas/hectárea","100 p/ha","200 p/ha","300 p/ha"],a:0,exp:"Resolución 169/2004. R-R = Residencial Rural = 50 p/ha (densidad más baja). Lote mínimo 1,000 m²."},
{id:106,block:4,topic:"R1-A",q:"¿Cuál es la densidad de R1-A?",o:["50 p/ha","100 p/ha","200 p/ha","300 p/ha"],a:1,exp:"Resolución 169/2004. R1-A = Residencial Baja Densidad = 100 p/ha. Lote mínimo: 800 m² unifamiliar / 400 m² bifamiliar."},
{id:107,block:4,topic:"R1-B",q:"Densidad R1-B:",o:["100 p/ha","150 p/ha","200 p/ha","250 p/ha"],a:2,exp:"Resolución 169/2004. R1-B = Residencial Baja Densidad = 200 p/ha."},
{id:108,block:4,topic:"R2-A",q:"Densidad R2-A:",o:["200 p/ha","250 p/ha","300 p/ha","400 p/ha"],a:2,exp:"Resolución 169/2004. R2-A = Residencial Mediana Densidad = 300 p/ha."},
{id:109,block:4,topic:"R2-B",q:"Densidad R2-B (permite apartamentos):",ctx:"R2-B es la primera zona residencial que permite construir apartamentos.",o:["300 p/ha","350 p/ha","400 p/ha","500 p/ha"],a:0,exp:"Resolución 169/2004. R2-B = 300 p/ha. PERMITE APARTAMENTOS (a diferencia de R2-A)."},
{id:110,block:4,topic:"R-3",q:"Densidad R-3:",o:["400 p/ha","500 p/ha","600 p/ha","800 p/ha"],a:0,exp:"Resolución 169/2004. R-3 = Residencial Mediana Densidad = 400 p/ha."},
{id:111,block:4,topic:"R-E",q:"Densidad R-E (Residencial Especial):",o:["400 p/ha","500 p/ha","600 p/ha","800 p/ha"],a:1,exp:"Resolución 169/2004. R-E = 500 p/ha. Lote mínimo 160 m²."},
{id:112,block:4,topic:"R-M",q:"Densidad R-M:",o:["500 p/ha","800 p/ha","600 p/ha","1,500 p/ha"],a:2,exp:"Resolución 169/2004. R-M = Residencial Alta Densidad = 600 p/ha."},
{id:113,block:4,topic:"RM-1",q:"Densidad RM-1:",o:["600 p/ha","750 p/ha","1,000 p/ha","1,500 p/ha"],a:1,exp:"Resolución 169/2004. RM-1 = 750 p/ha."},
{id:114,block:4,topic:"RM-2",q:"Densidad RM-2:",o:["750 p/ha","1,000 p/ha","1,500 p/ha","2,000 p/ha"],a:1,exp:"Resolución 169/2004. RM-2 = 1,000 p/ha."},
{id:115,block:4,topic:"RM-3",q:"Densidad RM-3 (la máxima residencial):",o:["1,000 p/ha","1,200 p/ha","1,500 p/ha","2,000 p/ha"],a:2,exp:"Resolución 169/2004. RM-3 = 1,500 p/ha. La MÁXIMA densidad residencial."},
{id:116,block:4,topic:"C-1",q:"¿Qué tipos de negocios incluye Comercial C-1 (Vecinal)?",o:["Solo industria","Abarroterías, kioscos, panaderías, salones de belleza, oficinas de residentes","Solo bancos y supermercados","Solo hoteles"],a:1,exp:"Resolución 169/2004. C-1 = Comercial Vecinal de baja intensidad. Pequeños negocios."},
{id:117,block:4,topic:"C-2",q:"¿Qué incluye Comercial C-2 (Urbano)?",o:["Solo abarroterías","Supermercados, centros comerciales, gasolineras, bancos, oficinas, hoteles","Solo viviendas","Solo industria pesada"],a:1,exp:"Resolución 169/2004. C-2 = Comercial Urbano de alta intensidad."},
{id:118,block:4,topic:"IL",q:"¿Qué es IL en zonificación industrial?",o:["Industria liviana","Industria mediana","Industria pesada","Industria mixta"],a:0,exp:"Resolución 169/2004. IL = Industria Liviana. Confites, hielo, imprentas, ropa, helados."},
{id:119,block:4,topic:"IM",q:"¿Qué es IM?",o:["Industria liviana","Industria Molesta (mediana)","Industria pesada","Industria militar"],a:1,exp:"Resolución 169/2004. IM = Industria Molesta. Aceites, bebidas gaseosas, cerámicas, colchones, harina."},
{id:120,block:4,topic:"IP",q:"¿Qué es IP?",o:["Industria pequeña","Industria parcial","Industria Peligrosa (pesada)","Industria privada"],a:2,exp:"Resolución 169/2004. IP = Industria Peligrosa. Explosivos, gases comprimidos, refinerías. Requiere permisos especiales del Cuerpo de Bomberos, Salud y MiAmbiente."},
{id:121,block:4,topic:"Áreas Especiales",q:"¿Cuál NO es un Área Especial reconocida?",o:["Áreas Revertidas","Casco Viejo / San Felipe","Renovación Urbana","Zona Residencial Suburbana"],a:3,exp:"Resolución 169/2004. Áreas especiales: Revertidas, Casco Viejo, Renovación Urbana, Áreas adyacentes a aeropuertos."},
{id:122,block:4,topic:"PV",q:"¿Qué significa PV en zonificación?",o:["Parques y vivienda","Parque vehicular","Parques y áreas verdes (Pulmón Verde)","Patio vecinal"],a:2,exp:"Resolución 169/2004. PV = Pulmón Verde / áreas verdes y parques."},
{id:123,block:4,topic:"AE",q:"¿Qué significa AE?",o:["Área estatal","Áreas especiales","Asociación educativa","Anchura especial"],a:1,exp:"Resolución 169/2004. AE = Áreas Especiales."},
{id:124,block:4,topic:"Rectora",q:"¿Qué autoridad es rectora del urbanismo?",o:["MICI","MIVIOT","MEF","ANATI"],a:1,exp:"Ley 6/2006. MIVIOT es la autoridad rectora."},
{id:125,block:4,topic:"Permiso",q:"¿Qué autoridad emite el permiso de construcción?",o:["MIVIOT","MICI","Municipio (Ingeniería Municipal)","ANATI"],a:2,exp:"Ley 6/2006. El Municipio emite el permiso, en base a las normas de zonificación del MIVIOT."},
{id:126,block:4,topic:"Plan parcial",q:"¿Qué es un plan parcial?",o:["Plan inicial","Desarrollo de un sector específico dentro del plan local","Plan provisional","Plan privado"],a:1,exp:"Ley 6/2006. Sector específico dentro del plan local."},
{id:127,block:4,topic:"Plan regional",q:"¿Qué cubre un plan regional?",o:["Solo distritos","Provincias y regiones","Comarcas","Solo ciudad capital"],a:1,exp:"Ley 6/2006. Provincias o regiones."},
{id:128,block:4,topic:"Aprobación",q:"¿Quién aprueba el plan local?",o:["MIVIOT solo","Concejo Municipal previo concepto MIVIOT","Asamblea Nacional","Consejo de Gabinete"],a:1,exp:"Ley 6/2006. Concejo Municipal con concepto previo del MIVIOT."},
{id:129,block:4,topic:"Cambios uso",q:"¿Quién aprueba los cambios de uso de suelo?",o:["Solo el propietario","MIVIOT con concepto Municipal","Solo Municipio","Solo MIVIOT"],a:1,exp:"Ley 6/2006. MIVIOT con concepto municipal previo."},
{id:130,block:4,topic:"Servidumbre playa",q:"¿De cuántos metros es la servidumbre desde la línea de marea alta?",o:["10m","15m","22m","30m"],a:2,exp:"Ley costera. 22 metros desde marea alta. Bien de uso público."},
{id:131,block:4,topic:"Línea construcción",q:"¿Qué es la línea de construcción?",o:["Línea decorativa","Distancia mínima desde el lindero hasta donde se puede construir","Línea de la calle","Línea catastral"],a:1,exp:"Ley 6/2006. Línea paralela al eje de vía pública que fija el límite de construcción."},
{id:132,block:5,topic:"Objeto Ley 2",q:"¿Cuál es el objeto de la Ley 2 de 2006?",o:["Concesiones de tierras y aguas en zonas costeras e insulares","Zonas francas","Casco Antiguo","Arrendamientos"],a:0,exp:"Ley 2/2006. Concesiones costeras e insulares."},
{id:133,block:5,topic:"Plazo concesión",q:"¿Cuál es el plazo máximo de concesión bajo Ley 2/2006?",o:["20 años","30 años","40 años + 30 prórroga (70 máx)","50 años"],a:2,exp:"Ley 2/2006. Cuarenta años más treinta de prórroga = 70 años máximo."},
{id:134,block:5,topic:"No enajenables",q:"¿Qué áreas NO son enajenables?",o:["Áreas urbanas","Áreas dentro de 10km de frontera y comarcas indígenas","Áreas costeras","Solo islas pequeñas"],a:1,exp:"Ley 2/2006. 10km de frontera y comarcas indígenas son inalienables."},
{id:135,block:5,topic:"Isla %",q:"¿Qué porcentaje máximo de una isla puede enajenarse?",o:["25%","30%","50%","75%"],a:2,exp:"Ley 2/2006. Cincuenta por ciento (50%) máximo."},
{id:136,block:5,topic:"Mejoras",q:"¿Qué porcentaje máximo se puede edificar (mejoras)?",o:["20%","30%","40%","50%"],a:1,exp:"Ley 2/2006. Treinta por ciento (30%) de mejoras edificables."},
{id:137,block:5,topic:"Vista",q:"¿Qué porcentaje se reserva para vista paisajística?",o:["20%","30%","40%","50%"],a:1,exp:"Ley 2/2006. Treinta por ciento (30%) para vista."},
{id:138,block:5,topic:"Sección Insular",q:"¿Dónde se inscriben las propiedades insulares?",o:["Registro Público común","Sección Propiedad Insular del Registro Público","ANATI directamente","ARAP únicamente"],a:1,exp:"Ley 2/2006. Sección de Propiedad Insular del RP."},
{id:139,block:5,topic:"Servidumbre",q:"¿De cuántos metros es la servidumbre de playa desde marea alta?",o:["10m","15m","22m","30m"],a:2,exp:"Veintidós metros desde la línea de marea alta."},
{id:140,block:5,topic:"Refrenda",q:"¿Qué requiere la concesión bajo Ley 2/2006?",o:["Solo MIVIOT","Refrenda de la Contraloría","Solo el Municipio","Solo Asamblea Nacional"],a:1,exp:"Ley 2/2006. Refrenda de la Contraloría General es obligatoria."},
{id:141,block:5,topic:"Ley 80/2009",q:"¿Cuál es el objeto de la Ley 80 de 2009?",o:["Titulación masiva de tierras del Estado","Concesiones marítimas","Casco Antiguo","Zonas Francas"],a:0,exp:"Ley 80/2009. Titulación masiva de tierras del Estado."},
{id:142,block:5,topic:"Posesión",q:"¿Cuántos años de posesión se requieren para titular bajo Ley 80/2009?",o:["3 años","5 años","10 años","15 años"],a:1,exp:"Ley 80/2009. Cinco años de posesión continua, pacífica y pública."},
{id:143,block:5,topic:"Hectáreas gratis",q:"¿Hasta cuántas hectáreas son gratuitas en titulación?",o:["1 ha","3 ha","5 ha (50,000m²)","10 ha"],a:2,exp:"Ley 80/2009. Hasta 5 hectáreas gratis. Lo que exceda se paga al Estado."},
{id:144,block:5,topic:"ANATI",q:"¿Desde cuándo opera ANATI?",o:["Ley 80/2009","Ley 59/2010","Ley 2/2006","Ley 6/2006"],a:1,exp:"Ley 59/2010 creó la Autoridad Nacional de Administración de Tierras."},
{id:145,block:5,topic:"Marginales",q:"¿Qué son las anotaciones marginales?",o:["Notas de margen","Restricciones inscritas en el RP que limitan transferencia","Resúmenes ejecutivos","Anotaciones notariales"],a:1,exp:"Restricciones inscritas en el folio. Limitan a quién se puede transferir."},
{id:146,block:5,topic:"Marginal transferencia",q:"¿A quién puede transferirse propiedad con marginal?",o:["A cualquiera","Solo cónyuge y 1° consanguinidad","A nadie","Solo a hermanos"],a:1,exp:"Ley 80/2009. Solo cónyuge o parientes en 1° grado."},
{id:147,block:5,topic:"Casco norma",q:"¿Qué Decreto Ley regula el Casco Antiguo?",o:["DL 6/1999","DL 9/1997","DL 18/1948","DL 41/2004"],a:1,exp:"Decreto Ley 9 de 1997 regula el Casco Antiguo."},
{id:148,block:5,topic:"Áreas Casco",q:"¿Qué áreas comprende el Casco Antiguo?",o:["Solo San Felipe","San Felipe, Santa Ana, Salsipuedes y Terraplén","Solo Santa Ana","Casco Viejo y Panamá Viejo"],a:1,exp:"DL 9/1997. Cuatro áreas."},
{id:149,block:5,topic:"UNESCO",q:"¿Cuándo declaró UNESCO el Casco como Patrimonio?",o:["Diciembre 1997","Enero 2000","Diciembre 2003","Junio 1990"],a:0,exp:"UNESCO. Diciembre 1997 (Casco) y 2003 (Panamá Viejo)."},
{id:150,block:5,topic:"Exoner Inmuebles",q:"¿Por cuántos años se exonera el Impuesto de Inmuebles en el Casco?",o:["10 años","20 años","30 años","Permanente"],a:2,exp:"DL 9/1997. Treinta años exoneración."},
{id:151,block:5,topic:"Exoner ISR",q:"¿Por cuántos años se exonera el ISR en el Casco?",o:["5 años","10 años","15 años","20 años"],a:1,exp:"DL 9/1997. Diez años exoneración del Impuesto Sobre la Renta."},
{id:152,block:5,topic:"ITBI Casco",q:"¿Cuál es el ITBI especial en primera venta del Casco?",o:["1%","2%","3%","5%"],a:1,exp:"DL 9/1997. ITBI 2% en primera venta."},
{id:153,block:5,topic:"Multa 136",q:"¿Cuál es la multa máxima bajo Ley 136/2013?",o:["B/.50,000","B/.100,000","B/.150,000","B/.500,000"],a:2,exp:"Ley 136/2013. Hasta B/.150,000."},
{id:154,block:5,topic:"OCA",q:"¿Qué autoridad supervisa el Casco Antiguo?",o:["Municipio Panamá","Oficina del Casco Antiguo (OCA) del MEF","MIVIOT","INAC"],a:1,exp:"OCA - Oficina del Casco Antiguo, adscrita al MEF."},
{id:155,block:5,topic:"Permisos Casco",q:"¿Qué tipos de obra requieren permiso especial en el Casco?",o:["Solo construcción nueva","Cualquier obra: nueva, ampliación, demolición, restauración","Solo demolición","Pintura solamente"],a:1,exp:"DL 9/1997. Cualquier intervención requiere permiso."},
{id:156,block:5,topic:"Conservación",q:"En el Casco se debe respetar:",o:["Diseño moderno","Arquitectura colonial e histórica original","Cualquier estilo","Estilo neoclásico solamente"],a:1,exp:"DL 9/1997. Conservar arquitectura colonial-republicana."},
{id:157,block:5,topic:"INAC",q:"¿Qué papel juega el INAC?",o:["Ninguno","Aprueba intervenciones culturales en monumentos","Solo museos","Es el dueño del Casco"],a:1,exp:"INAC aprueba intervenciones en bienes culturales."},
{id:158,block:5,topic:"Categorías inmuebles",q:"¿Cómo se categorizan los inmuebles en el Casco?",o:["No hay categorías","Por valor histórico (categoría 1, 2, 3)","Por tamaño","Por antigüedad"],a:1,exp:"DL 9/1997. Categorías por valor histórico-arquitectónico."},
{id:159,block:5,topic:"Proceso titulación",q:"¿Cuál es el proceso de titulación bajo Ley 80/2009?",o:["Inmediato","Solicitud, inspección, edicto, resolución","Solo registro","Subasta pública"],a:1,exp:"Ley 80/2009. Solicitud → inspección → edicto público → resolución."},
{id:160,block:5,topic:"Quien titula",q:"¿Qué entidad titula bajo Ley 80/2009?",o:["MEF","ANATI","Reforma Agraria","Catastro"],a:1,exp:"ANATI titula desde la Ley 59/2010."},
{id:161,block:5,topic:"Comarcas",q:"¿Pueden titularse tierras dentro de comarcas indígenas?",o:["Sí, libremente","No, son inalienables","Solo el Estado","Solo a comarca"],a:1,exp:"Ley 2/2006. Inalienables. Pertenecen colectivamente a la comarca."},
{id:162,block:5,topic:"Frontera",q:"¿Quién puede ser titular de terreno dentro de los 10km de frontera?",o:["Cualquier persona","Solo panameños y con autorización","Solo el Estado","Inalienable totalmente"],a:1,exp:"Ley 2/2006. Solo panameños con autorización."},
{id:163,block:5,topic:"Litorales",q:"¿Pertenecen los litorales al Estado?",o:["No","Sí, son bienes de uso público","Solo zona costera","Solo islas"],a:1,exp:"Bienes de uso público inalienables e imprescriptibles."},
{id:164,block:5,topic:"Adjudicación",q:"¿Qué es la adjudicación posesoria?",o:["Donación","Acto por el cual ANATI titula al poseedor","Embargo","Subasta"],a:1,exp:"Ley 80/2009. Titulación al poseedor que cumple los 5 años."},
{id:165,block:5,topic:"Reforma Agraria",q:"¿Qué entidad existió antes de ANATI?",o:["MIVI","Reforma Agraria","MIVIOT","DGI"],a:1,exp:"Reforma Agraria fue absorbida por ANATI mediante la Ley 59/2010."},
{id:166,block:5,topic:"Eléctrica",q:"¿Quién impone la servidumbre eléctrica?",o:["Empresas privadas","ASEP","Municipio","MIVIOT"],a:1,exp:"ASEP regula servidumbres eléctricas."},
{id:167,block:6,topic:"Objeto Ley 3/1985",q:"¿Cuál es el objeto original de la Ley 3 de 1985?",o:["Impuestos","Régimen de intereses preferenciales en préstamos hipotecarios para vivienda","Zonas francas","Arrendamientos"],a:1,exp:"Ley 3/1985. Régimen preferencial de intereses en hipotecas para vivienda nueva."},
{id:168,block:6,topic:"Ley 468/2025",q:"¿Cuál es el estado actual de la Ley 3/1985 en abril 2026?",ctx:"PREGUNTA CRÍTICA Y ACTUALIZADA: La Ley 468/2025 cambió todo el régimen.",o:["Sigue igual","Subrogada por Ley 468/2025, vigente desde 1 enero 2026","Derogada totalmente","Sin cambios"],a:1,exp:"Ley 468/2025 subroga la Ley 3/1985 con vigencia desde el 1 de enero de 2026. Reorganiza tramos, tasas y subsidios."},
{id:169,block:6,topic:"Tramo 1",q:"¿Cuál es la tasa máxima del Tramo 1 (hasta B/.50,000) bajo Ley 468/2025?",o:["3%","4%","4.5%","5%"],a:3,exp:"Ley 468/2025. Tramo 1: 5% máximo, plazo 8 años."},
{id:170,block:6,topic:"Tramo 2",q:"¿Tasa máxima Tramo 2 (B/.50,000.01 a B/.80,000)?",o:["3%","4%","4.5%","5%"],a:2,exp:"Ley 468/2025. Tramo 2: 4.5% máximo, plazo 7 años."},
{id:171,block:6,topic:"Tramo 3",q:"¿Tasa máxima Tramo 3 (B/.80,000.01 a B/.120,000)?",o:["3%","4%","4.5%","5%"],a:1,exp:"Ley 468/2025. Tramo 3: 4% máximo, plazo 7 años."},
{id:172,block:6,topic:"Subsidio",q:"¿Qué porcentaje subsidia el Estado bajo Ley 468/2025?",o:["50%","70%","85%","100%"],a:2,exp:"Ley 468/2025. Hasta 85% del subsidio."},
{id:173,block:6,topic:"Diferencia tasa",q:"¿Quién paga la diferencia entre tasa pactada y preferencial?",o:["El comprador","El banco","El Estado mediante crédito fiscal","El vendedor"],a:2,exp:"Mecanismo central. El Estado vía crédito fiscal compensa al banco."},
{id:174,block:6,topic:"Beneficiarios",q:"¿Quién puede ser beneficiario del crédito preferencial?",o:["Cualquier persona","Solo panameños","Panameños o extranjeros con residencia permanente","Solo casados"],a:2,exp:"Ley 399/2023 y Ley 468/2025. Panameños o residentes permanentes."},
{id:175,block:6,topic:"FECI",q:"¿Qué es el FECI?",o:["Fondo de Educación","Fondo Especial de Compensación de Intereses","Fondo de Energía","Fondo Estatal Comercial"],a:1,exp:"Ley 4/1994. Fondo Especial de Compensación de Intereses. Financia los subsidios."},
{id:176,block:6,topic:"FECI tasa",q:"¿Cuál es la sobretasa FECI?",o:["0.5%","1% sobre préstamos comerciales","1.5%","2%"],a:1,exp:"Ley 4/1994. 1% sobre préstamos comerciales y personales."},
{id:177,block:6,topic:"Ley 66/2017",q:"¿Qué introdujo la Ley 66 de 2017?",o:["Ganancia capital","Patrimonio Familiar Tributario y Vivienda Principal","FECI","Casco Antiguo"],a:1,exp:"Ley 66/2017. Introdujo el PFT y VP con tarifas reducidas del Impuesto de Inmuebles."},
{id:178,block:6,topic:"PFT exento",q:"¿Hasta qué monto está exento el PFT/VP del Impuesto de Inmuebles?",o:["B/.30,000","B/.100,000","B/.120,000","B/.250,000"],a:2,exp:"Ley 66/2017. Hasta B/.120,000 exento."},
{id:179,block:6,topic:"PFT 0.5%",q:"¿Tarifa para PFT/VP de B/.120,001 a B/.700,000?",o:["0.3%","0.5%","0.6%","0.7%"],a:1,exp:"Ley 66/2017. 0.5% sobre la fracción que exceda B/.120,000."},
{id:180,block:6,topic:"PFT 0.7%",q:"¿Tarifa PFT/VP mayor a B/.700,000?",o:["0.5%","0.6%","0.7%","1.0%"],a:2,exp:"Ley 66/2017. 0.7% sobre la fracción que exceda B/.700,000."},
{id:181,block:6,topic:"No PFT exento",q:"¿Hasta qué monto está exento un inmueble que NO es PFT/VP?",o:["B/.30,000","B/.50,000","B/.100,000","B/.120,000"],a:0,exp:"Ley 66/2017. B/.30,000 para inmuebles que no califican como PFT/VP."},
{id:182,block:6,topic:"No PFT 0.6%",q:"Tarifa otros inmuebles B/.30,001 a B/.250,000:",o:["0.3%","0.5%","0.6%","0.8%"],a:2,exp:"Ley 66/2017. 0.6%."},
{id:183,block:6,topic:"No PFT 0.8%",q:"Tarifa otros B/.250,001 a B/.500,000:",o:["0.5%","0.6%","0.8%","1.0%"],a:2,exp:"Ley 66/2017. 0.8%."},
{id:184,block:6,topic:"No PFT 1.0%",q:"Tarifa otros más de B/.500,000:",o:["0.7%","0.8%","1.0%","1.5%"],a:2,exp:"Ley 66/2017. 1.0%."},
{id:185,block:6,topic:"Definición PFT",q:"¿Qué es el Patrimonio Familiar Tributario (PFT)?",o:["Bien comercial","Inmueble del propietario para uso permanente con su familia","Solo casa heredada","Bien en sociedad"],a:1,exp:"Ley 66/2017. Inmueble donde reside el propietario y su familia bajo el mismo techo."},
{id:186,block:6,topic:"PFT vs VP",q:"¿Diferencia entre PFT y VP?",o:["No hay diferencia","PFT con familia bajo mismo techo, VP persona natural sola","Distintos tributos","PFT comercial, VP residencial"],a:1,exp:"PFT con familia. VP persona natural sola. Mismo tratamiento tributario."},
{id:187,block:6,topic:"Pronto pago",q:"¿Qué descuento por pronto pago de Inmuebles?",o:["5%","8%","10% antes 29 febrero","15%"],a:2,exp:"DGI/MEF. 10% antes del 29 de febrero del año fiscal."},
{id:188,block:6,topic:"Agropecuario",q:"¿Qué exoneración para fincas agropecuarias?",o:["No hay","5 años + 5 años de prórroga si valor < B/.500,000","10 años","Permanente"],a:1,exp:"Ley 66/2017. Cinco más cinco años si valor inferior a B/.500,000."},
{id:189,block:6,topic:"ITBI tasa",q:"¿Cuál es la tasa del ITBI?",o:["1%","2%","3%","5%"],a:1,exp:"Art. 701 Código Fiscal. 2% sobre la base imponible."},
{id:190,block:6,topic:"ITBI vendedor",q:"¿Quién paga el ITBI?",ctx:"Esta pregunta es ALTAMENTE recurrente en el examen.",o:["Comprador","Vendedor","Mitad cada uno","Banco"],a:1,exp:"Ley 106/1974. El ITBI lo paga el VENDEDOR. Cualquier cláusula que lo traslade al comprador es nula."},
{id:191,block:6,topic:"GC tasa",q:"¿Tasa de Ganancia de Capital?",o:["3%","5%","10% (con anticipo 3%)","15%"],a:2,exp:"10% sobre ganancia, anticipo 3%. El contribuyente puede optar por el 3% si es menor que el 10% real."},
{id:192,block:6,topic:"GC base",q:"¿Sobre qué se calcula el anticipo del 3% de Ganancia de Capital?",o:["Solo valor catastral","Solo precio venta","El mayor entre venta o catastral","La ganancia"],a:2,exp:"3% sobre el MAYOR entre precio de venta o valor catastral actualizado. Protege contra subvaluaciones."},
{id:193,block:6,topic:"Form 106",q:"¿Qué es el Formulario 106 de la DGI?",o:["ITBI (Transferencia)","Ganancia Capital","Renta","Donaciones"],a:0,exp:"Form 106 = ITBI = transferencia."},
{id:194,block:6,topic:"Form 107",q:"Formulario 107 de la DGI:",o:["ITBI","Ganancia Capital","Inmuebles","Patente"],a:1,exp:"Form 107 = Ganancia de Capital."},
{id:195,block:6,topic:"Exentos",q:"¿Cuáles inmuebles están totalmente exentos del Impuesto de Inmuebles?",o:["Solo iglesias","Estado, embajadas, iglesias, beneficencia, vivienda discapacitado <B/.250,000","Solo PFT","Solo agropecuarios"],a:1,exp:"Art. 764 Código Fiscal + Ley 43/1999."},
{id:196,block:6,topic:"Discapacidad",q:"¿Hasta qué valor está exenta vivienda principal de discapacitado?",o:["B/.100,000","B/.150,000","B/.250,000","B/.500,000"],a:2,exp:"Ley 43/1999. Hasta B/.250,000 valor catastral, totalmente exenta."},
{id:197,block:6,topic:"e-Tax",q:"¿Por qué portal se solicita el PFT en línea?",o:["MIVIOT online","e-Tax 2.0 de DGI","Banca en línea","Asamblea Nacional"],a:1,exp:"DGI. Portal e-Tax 2.0."},
{id:198,block:6,topic:"Ley 3 requisitos",q:"¿Qué requisitos debía tener un préstamo bajo la Ley 3/1985 (vigente hasta dic 2025)?",o:["Cualquier vivienda","Vivienda nueva, residencia principal, garantía hipotecaria, plazo no menor 15 años","Solo apartamentos","Solo segunda vivienda"],a:1,exp:"Ley 3/1985. Múltiples requisitos."},
{id:199,block:7,topic:"DL 18/1948",q:"¿Qué crea el Decreto Ley 18 de 1948?",o:["JTBR","Zona Libre de Colón (ZLC)","Casco Antiguo","Panamá-Pacífico"],a:1,exp:"DL 18/1948. ZLC. La zona franca más antigua de América Latina."},
{id:200,block:7,topic:"ZLC tamaño",q:"¿Cuántas hectáreas tiene la ZLC?",o:["500 ha","800 ha","1,064.5 ha","2,000 ha"],a:2,exp:"ZLC. Aproximadamente 1,064.5 hectáreas."},
{id:201,block:7,topic:"ZLC empresas",q:"¿Cuántas empresas aproximadamente operan en ZLC?",o:["500","1,000","2,000","5,000"],a:2,exp:"ZLC. Aproximadamente 2,000 empresas."},
{id:202,block:7,topic:"ZLC beneficios",q:"¿Cuáles son los beneficios fiscales de la ZLC?",o:["Solo aduana","Libre de todo impuesto, contribución y gravamen nacional, provincial o municipal","Solo IVA","Solo Renta"],a:1,exp:"DL 18/1948. Libre de todo impuesto sobre operaciones de comercio exterior."},
{id:203,block:7,topic:"JD-03-2009",q:"¿Qué establece la Resolución JD-03-2009?",o:["Crea ZLC","Cánones de arrendamiento y tasas en ZLC","Sanciones","Crea Panamá-Pacífico"],a:1,exp:"Cánones y tasas en ZLC."},
{id:204,block:7,topic:"Ley 32/2011",q:"¿Cuál es el objeto de la Ley 32 de 2011?",o:["Régimen especial integral simplificado de zonas francas","ZLC solamente","Casco Antiguo","Panamá-Pacífico"],a:0,exp:"Ley 32/2011. Régimen general de zonas francas en Panamá."},
{id:205,block:7,topic:"DE 62/2017",q:"¿Qué Decreto reglamenta actualmente la Ley 32/2011?",o:["DE 26/2012","DE 62/2017","DE 39/2001","DE 363/2018"],a:1,exp:"DE 62/2017 sustituyó al DE 26/2012."},
{id:206,block:7,topic:"Ley 125/2013",q:"¿Qué Ley actualizó la Ley 32/2011?",o:["Ley 41/2004","Ley 125/2013","Ley 66/2018","Ley 23/2015"],a:1,exp:"Ley 125/2013 modificó la Ley 32/2011."},
{id:207,block:7,topic:"Aprobación ZF",q:"¿Quién aprueba el establecimiento de zonas francas?",o:["Solo MICI","Comisión Nacional de Zonas Francas y Consejo de Gabinete","Solo Asamblea","JTBR"],a:1,exp:"Ley 32/2011. Comisión Nacional ZF + Consejo de Gabinete."},
{id:208,block:7,topic:"ZF tamaño",q:"¿Tamaño mínimo de zona franca?",o:["1 ha","2 ha","5 ha","10 ha"],a:1,exp:"Ley 32/2011. Mínimo 2 hectáreas."},
{id:209,block:7,topic:"ZF inversión",q:"¿Inversión mínima para zona franca?",o:["B/.100,000","B/.250,000","B/.500,000","B/.1,000,000"],a:1,exp:"Ley 32/2011. B/.250,000 inversión mínima."},
{id:210,block:7,topic:"Plazo inversión",q:"¿Plazo para iniciar la inversión?",o:["6 meses","1 año","2 años","3 años"],a:1,exp:"Art. 28 Ley 32/2011. Un año para iniciar la inversión."},
{id:211,block:7,topic:"Plazo actividad",q:"¿Plazo para iniciar la actividad?",o:["1 año","2 años","3 años","5 años"],a:1,exp:"Art. 28 Ley 32/2011. Dos años para iniciar actividad."},
{id:212,block:7,topic:"No actividades",q:"¿Qué actividades NO incluye la lista de Ley 32/2011?",o:["Producción de bienes","Servicios logísticos","Casinos y apuestas","Educación superior"],a:2,exp:"Ley 32/2011. Casinos NO son actividad permitida en ZF."},
{id:213,block:7,topic:"Beneficio renta ZF",q:"¿Qué exoneración del ISR aplica en ZF?",o:["No hay","Operaciones exteriores (exportaciones) exentas","Solo primer año","Total"],a:1,exp:"Ley 32/2011. Operaciones exteriores exentas. Operaciones interiores sí pagan."},
{id:214,block:7,topic:"Op exterior",q:"¿Qué es operación exterior?",o:["Cualquier venta","Enajenación al exterior, otras zonas francas, ZLC, Panamá-Pacífico","Solo exportación","Solo importación"],a:1,exp:"DE 62/2017. Concepto amplio."},
{id:215,block:7,topic:"Op interior",q:"Operación interior:",o:["Venta dentro ZF","Enajenación al territorio fiscal nacional (gravado)","Solo administrativa","Solo entre socios"],a:1,exp:"DE 62/2017. Al territorio fiscal nacional."},
{id:216,block:7,topic:"DMC",q:"¿Qué es la DMC?",o:["Dirección Movimiento Comercial","Declaración de Movimiento Comercial Zonas Francas","Documento Mercantil","Diligencia Mercantil"],a:1,exp:"Art. 20 DE 62/2017. Formulario único en VUCE."},
{id:217,block:7,topic:"VUCE",q:"¿Qué es VUCE?",o:["Ventana Comercial","Ventanilla Única de Comercio Exterior","Vinculación Comercial","Verificación Comercio"],a:1,exp:"Ventanilla única para todos los trámites de comercio exterior."},
{id:218,block:7,topic:"Migratorio",q:"¿Qué beneficio migratorio existe en ZF?",o:["Ninguno","Permiso de Residente Permanente para inversionistas y Temporal para personal","Solo visa turista","Solo PR"],a:1,exp:"Ley 32/2011. Visa especial para inversionistas y técnicos."},
{id:219,block:7,topic:"Ley 41/2004",q:"¿Qué crea la Ley 41 de 2004?",o:["ZLC","Área Económica Especial Panamá-Pacífico (PP)","Casco Antiguo","JTBR"],a:1,exp:"Ley 41/2004. Crea Panamá-Pacífico."},
{id:220,block:7,topic:"PP ubicación",q:"¿Dónde se ubica Panamá-Pacífico?",o:["Colón","Arraiján (antigua base aérea Howard)","Coclé","Chiriquí"],a:1,exp:"Ley 41/2004. Howard, Arraiján."},
{id:221,block:7,topic:"PP naturaleza",q:"¿Cuál es la naturaleza de la Agencia Panamá-Pacífico?",o:["Empresa privada","Entidad autónoma del Estado","Ministerio","Sociedad anónima"],a:1,exp:"Art. 4 Ley 41/2004. Entidad autónoma del Estado."},
{id:222,block:7,topic:"PP adscripción",q:"¿A qué ente se adscribe la Agencia PP?",o:["MICI","MIVIOT","Ministerio de la Presidencia","MEF"],a:2,exp:"Ministerio de la Presidencia."},
{id:223,block:7,topic:"PP JD",q:"¿Cuántos miembros tiene la Junta Directiva de la Agencia PP?",o:["7","9","11","13"],a:2,exp:"Ley 41/2004. Once miembros."},
{id:224,block:7,topic:"PP período",q:"¿Período de los miembros de la JD PP?",o:["2 años","3 años","4 años","5 años"],a:2,exp:"Ley 41/2004. Cuatro años."},
{id:225,block:7,topic:"PP Art 58",q:"¿Cuál es el beneficio del Art. 58 de Ley 41/2004?",o:["Solo aduana","Área 100% libre de todo impuesto, salvo excepciones","Solo IVA","Solo licencia"],a:1,exp:"Art. 58 Ley 41/2004. Régimen de exoneración total con excepciones."},
{id:226,block:7,topic:"ITBI PP",q:"¿Hasta cuándo va la exoneración ITBI en PP?",o:["2025","1 enero 2030","2040","Indefinido"],a:1,exp:"Ley 66/2018. Hasta el 1 de enero de 2030."},
{id:227,block:7,topic:"Importación PP",q:"¿Hasta qué monto se exime la importación doméstica en PP?",o:["US$50,000","US$100,000","US$250,000","Sin límite"],a:1,exp:"Art. 77 Ley 41/2004. US$100,000 anuales por empresa."},
{id:228,block:7,topic:"24/7",q:"¿Las empresas en PP pueden operar?",o:["Solo horario diurno","24/7 sin recargos por turnos","Solo lunes-viernes","Con horario restringido"],a:1,exp:"Ley 41/2004. Operación 24/7 sin recargos."},
{id:229,block:7,topic:"Extranjeros PP",q:"¿Hasta qué porcentaje de trabajadores extranjeros?",o:["5%","10-15%","20%","30%"],a:1,exp:"Ley 41/2004. 10-15%, incrementable para técnicos."},
{id:230,block:7,topic:"TFN",q:"¿Qué es Territorio Fiscal Nacional?",o:["Todo Panamá","Panamá excluyendo PP y otras áreas con régimen especial","Solo capital","Solo zonas francas"],a:1,exp:"Art. 3 Ley 41/2004. Resto del país."},
{id:231,block:7,topic:"Ley 31/2009",q:"¿Qué hizo la Ley 31 de 2009?",o:["Creó PP","Modificó la Ley 41/2004 ampliando incentivos","Creó ZLC","Crea Comarca"],a:1,exp:"Ley 31/2009. Modificó Arts. 58 y 60 de la Ley 41/2004."},
{id:232,block:7,topic:"Ley 66/2018",q:"¿Qué hizo la Ley 66 de 2018 sobre PP?",o:["Derogó la 41","Adapta el régimen a estándares internacionales (sustancia económica)","No modificó nada","Solo creó cargos"],a:1,exp:"Ley 66/2018. Adaptó a estándares OCDE/BEPS."},
{id:233,block:7,topic:"Importancia",q:"¿Por qué el CBR debe conocer las ZF y áreas especiales?",o:["Por curiosidad","Por tratamiento fiscal especial e implicaciones tributarias en transacciones","No es relevante","Solo si trabaja en Colón"],a:1,exp:"Tratamiento fiscal especial muy distinto al territorio fiscal nacional."},
{id:234,block:8,topic:"Ley 284/2022",q:"¿Cuál es el objeto de la Ley 284 de 2022?",ctx:"Esta Ley reemplazó completamente el régimen anterior de PH (Ley 31/2010).",o:["Crear PH","Régimen de Propiedad Horizontal (subroga Ley 31/2010)","ZLC","Turismo"],a:1,exp:"Ley 284/2022. Subroga la Ley 31/2010 e introduce modernizaciones."},
{id:235,block:8,topic:"Estructura",q:"¿Cuántos capítulos y artículos tiene la Ley 284/2022?",o:["8 cap, 100 arts","10 capítulos y 125 artículos","12 cap, 150 arts","15 cap, 200 arts"],a:1,exp:"Ley 284/2022. 10 capítulos y 125 artículos."},
{id:236,block:8,topic:"Principios",q:"¿Cuántos principios rectores tiene el Régimen?",o:["3","5","7","10"],a:2,exp:"Art. 2 Ley 284/2022. Siete principios rectores."},
{id:237,block:8,topic:"Inmuebles PH",q:"¿Qué inmuebles pueden someterse a PH?",o:["Solo edificios","Edificios, conjuntos en hilera, lotes con servicios, urbanizaciones","Solo casas","Solo apartamentos"],a:1,exp:"Art. 3 Ley 284/2022. Concepto amplio."},
{id:238,block:8,topic:"Hipoteca previa",q:"¿Qué se requiere si hay hipoteca previa al someter a PH?",o:["Nada","Consentimiento del acreedor hipotecario","Solo notificación","Pago de la hipoteca"],a:1,exp:"Art. 5 Ley 284/2022. Consentimiento expreso."},
{id:239,block:8,topic:"Coeficiente",q:"¿Qué es el coeficiente de participación?",o:["Tasa de interés","Porcentaje del propietario en bienes comunes","Cuota mensual","Impuesto"],a:1,exp:"Art. 41 Ley 284/2022. Porcentaje en bienes comunes y obligaciones."},
{id:240,block:8,topic:"3 fases",q:"¿Cuáles son las 3 fases para constituir PH?",o:["Solo Registro","MIVIOT, Notario, Registro Público","Solo Notario","Asamblea, JD, Asambleas"],a:1,exp:"Art. 38 Ley 284/2022. Aprobación MIVIOT → escritura ante notario → inscripción en RP."},
{id:241,block:8,topic:"Reserva nombre",q:"¿Cuánto dura la reserva de nombre del proyecto?",o:["6 meses","1 año prorrogable","2 años","3 años"],a:1,exp:"Art. 37 Ley 284/2022. Un año prorrogable."},
{id:242,block:8,topic:"Multa inasist",q:"¿Cuál es la multa por inasistencia a Asamblea?",o:["10%","15%","20% de cuota gastos comunes","50%"],a:2,exp:"Ley 284/2022. 20% del gasto común mensual."},
{id:243,block:8,topic:"Mayoría",q:"¿Mayoría para decisiones bajo Ley 284/2022?",ctx:"CAMBIO IMPORTANTE: La nueva ley redujo el umbral de mayoría.",o:["33%","51% (antes 66%)","66%","75%"],a:1,exp:"Ley 284/2022 redujo de 66% a 51%. Facilita la toma de decisiones."},
{id:244,block:8,topic:"Convocatoria",q:"¿En cuántos días se hace la segunda convocatoria?",o:["3 días","7 días","10 días calendario","30 días"],a:2,exp:"Ley 284/2022. Diez días calendario."},
{id:245,block:8,topic:"Fondo Imprev",q:"¿Cuál es el aporte al Fondo de Imprevistos?",o:["0.5%","1% de ingresos y cuotas anuales","2%","5%"],a:1,exp:"Ley 284/2022. 1% obligatorio."},
{id:246,block:8,topic:"Anejos",q:"¿Qué son los bienes anejos?",o:["Bienes comunes","Bienes privativos asignados a una unidad (estacionamiento, depósito)","Bienes hipotecados","Bienes embargados"],a:1,exp:"Privativos asignados a una unidad específica."},
{id:247,block:8,topic:"Traspaso anejo",q:"¿Cómo se traspasa un bien anejo?",o:["Verbalmente","Escritura Pública e inscripción en RP","Por carta","Por correo"],a:1,exp:"Ley 284/2022. EP + inscripción en RP."},
{id:248,block:8,topic:"Asamblea virtual",q:"¿Permite la Ley 284 asambleas por medios tecnológicos?",o:["No","Sí, por medios tecnológicos","Solo presenciales","Solo por correo"],a:1,exp:"Innovación Ley 284/2022."},
{id:249,block:8,topic:"Comités",q:"¿La Junta puede crear Comités de Apoyo?",o:["No","Sí, para tareas específicas","Solo el administrador","Solo por Asamblea"],a:1,exp:"Innovación Ley 284/2022."},
{id:250,block:8,topic:"Resp JD",q:"¿Son personalmente responsables los miembros de JD?",o:["Sí siempre","No por actuaciones realizadas en cargo","Solo el presidente","Solo civil"],a:1,exp:"Arts. 83 y 96 Ley 284/2022."},
{id:251,block:8,topic:"Inhabilitación",q:"¿Pueden inhabilitarse miembros JD por mal manejo?",o:["No","Sí, por la Dirección PH del MIVIOT","Solo por Asamblea","Solo penal"],a:1,exp:"Ley 284/2022. La Dirección de PH del MIVIOT puede inhabilitar."},
{id:252,block:8,topic:"Mediación",q:"¿Promueve la Ley 284 algún mecanismo alternativo?",o:["No","Mediación y arbitraje antes de tribunales","Solo tribunales","Solo administrativo"],a:1,exp:"Ley 284/2022. Mediación y arbitraje preferente."},
{id:253,block:8,topic:"Comunes",q:"¿Qué son los bienes comunes?",o:["De un copropietario","Pertenecen a todos los propietarios (pasillos, ascensores, piscina)","Del promotor","Del Municipio"],a:1,exp:"Art. 6 Ley 284/2022."},
{id:254,block:8,topic:"Art 1343",q:"¿Qué artículo del Código Civil regula la garantía estructural?",o:["Art. 1215","Art. 1343","Art. 1220","Art. 1400"],a:1,exp:"Art. 1343 CC. Garantía decenal del constructor."},
{id:255,block:8,topic:"Promotor",q:"¿Qué debe hacer el promotor?",o:["Mantener sociedad por tiempo de garantía Art. 1343 CC","Solo registrar","Solo construir","Solo vender"],a:0,exp:"Ley 284/2022."},
{id:256,block:8,topic:"Domicilio",q:"¿Dónde debe estar domiciliada la sociedad promotora?",o:["Cualquier país","En Panamá","En el extranjero","Donde decida"],a:1,exp:"Ley 284/2022."},
{id:257,block:8,topic:"Garantía bienes",q:"¿Qué requiere garantía sobre bien PH?",o:["Nada","Notificación escrita a la administración","Solo banco","Solo notario"],a:1,exp:"Ley 284/2022."},
{id:258,block:8,topic:"Designación admin",q:"¿Quién designa al administrador?",o:["Asamblea","Junta Directiva","Promotor","MIVIOT"],a:1,exp:"Ley 284/2022. JD designa."},
{id:259,block:8,topic:"Cesa admin",q:"¿Quién puede cesar al administrador?",o:["Solo JD","Asamblea por urgencia/necesidad","Solo MIVIOT","Tribunal solo"],a:1,exp:"Ley 284/2022."},
{id:260,block:8,topic:"Ley 80/2012",q:"¿Cuál es el objeto de la Ley 80 de 2012?",o:["Crear ATP","Incentivos para fomento de la actividad turística","Casco Antiguo","Zonas Francas"],a:1,exp:"Ley 80/2012. Régimen de incentivos al turismo."},
{id:261,block:8,topic:"Carácter",q:"¿Qué carácter tiene la actividad turística?",o:["Privado","De interés nacional","Solo cultural","Mercantil"],a:1,exp:"Art. 1 Ley 80/2012."},
{id:262,block:8,topic:"Inv fuera Pmá",q:"¿Inversión mínima fuera del distrito de Panamá?",o:["B/.100,000","B/.250,000","B/.500,000","B/.1,000,000"],a:1,exp:"Art. 4 Ley 80/2012 mod. Ley 82/2019. B/.250,000."},
{id:263,block:8,topic:"Inv indígenas",q:"¿Inversión mínima en áreas indígenas?",o:["B/.50,000","B/.100,000","B/.250,000","B/.500,000"],a:1,exp:"Ley 82/2019. B/.100,000."},
{id:264,block:8,topic:"Inv distrito Pmá",q:"¿Inversión mínima en distrito de Panamá?",o:["B/.1,000,000","B/.5,000,000","B/.8,000,000","B/.10,000,000"],a:2,exp:"Art. 6 Ley 80/2012. B/.8 millones."},
{id:265,block:8,topic:"Inv convenciones",q:"¿Inversión mínima centros de convenciones?",o:["B/.5,000,000","B/.10,000,000","B/.20,000,000","B/.30,000,000"],a:3,exp:"Art. 8 num. 1 Ley 80/2012. B/.30 millones."},
{id:266,block:8,topic:"Exoner construcción",q:"¿Cuántos años exonera importación de materiales construcción?",o:["3 años","5 años","10 años","15 años"],a:1,exp:"Art. 4 Ley 80/2012. Cinco años."},
{id:267,block:8,topic:"Exoner equipo",q:"¿Y para equipamiento (muebles, enseres)?",o:["5 años","10 años","15 años","20 años"],a:1,exp:"Art. 4. Diez años."},
{id:268,block:8,topic:"Inm fuera",q:"¿Exoneración Impuesto Inmuebles fuera distrito Panamá?",o:["5 años","10 años","15 años","20 años"],a:2,exp:"Art. 4. Quince años fuera."},
{id:269,block:8,topic:"Inm dentro",q:"¿Exoneración Impuesto Inmuebles dentro distrito Panamá?",o:["5 años","10 años","15 años","20 años"],a:1,exp:"Art. 4. Diez años dentro."},
{id:270,block:8,topic:"Exoner Renta",q:"¿Cuántos años exonera ISR de actividad turística?",o:["10 años","12 años","15 años","20 años"],a:2,exp:"Art. 4. Quince años."},
{id:271,block:8,topic:"Plazo servicio",q:"¿Cuál es el plazo mínimo de servicio turístico?",o:["5 años","8 años","10 años","15 años"],a:2,exp:"Art. 17 Ley 80/2012. Diez años."},
{id:272,block:8,topic:"Fianza tur",q:"¿Cuál es la fianza de cumplimiento turística?",o:["1%","2% de la inversión (máx B/.1,000,000)","5%","10%"],a:1,exp:"Ley 80/2012. 2% máx B/.1,000,000."},
{id:273,block:8,topic:"Plazo fianza",q:"¿Plazo para consignar la fianza?",o:["15 días","30 días improrrogables","60 días","90 días"],a:1,exp:"Ley 80/2012. 30 días improrrogables."},
{id:274,block:8,topic:"Bono",q:"¿Qué crédito fiscal otorgó el bono turístico (Ley 122/2019)?",o:["50%","75%","100% del ISR (vigente hasta 31 dic 2025)","125%"],a:2,exp:"Ley 122/2019. 100% del ISR como crédito hasta 31 diciembre 2025."},
{id:275,block:8,topic:"ATP",q:"¿Quién otorga los incentivos turísticos?",o:["MICI","ATP - Autoridad de Turismo de Panamá","MEF","JTBR"],a:1,exp:"Art. 15 Ley 80/2012."},
{id:276,block:9,topic:"Compraventa",q:"¿Cómo se define la compraventa según el Código Civil?",o:["Acuerdo informal","Vendedor entrega cosa, comprador paga precio cierto en dinero","Solo escrito","Acuerdo gratuito"],a:1,exp:"Art. 1215 CC."},
{id:277,block:9,topic:"Elementos",q:"¿Cuántos elementos esenciales tiene la compraventa?",o:["3","4","5 (consentimiento, objeto, causa, capacidad, solemnidad)","6"],a:2,exp:"Arts. 1112-1220 CC."},
{id:278,block:9,topic:"Forma",q:"¿Qué forma debe tener la venta de inmuebles?",o:["Verbal","Escrita simple","Escritura pública","Cualquier forma"],a:2,exp:"Art. 1220 CC. Escritura Pública."},
{id:279,block:9,topic:"Dominio",q:"¿Cuándo se transfiere el dominio en compraventa de inmueble?",o:["Al firmar contrato","Al pagar","Al inscribir en Registro Público","Al entregar llaves"],a:2,exp:"Art. 1232 + 1753 num.1 CC. Doctrina título y modo: la EP es el título, la inscripción en el RP es el modo."},
{id:280,block:9,topic:"Inscripción",q:"¿Es la inscripción solemnidad del contrato?",o:["Sí","No, es modo de tradición","Solo registral","Mercantil"],a:1,exp:"Jurisprudencia. La solemnidad es la EP; la inscripción es modo de tradición."},
{id:281,block:9,topic:"Prohibiciones",q:"¿Cuántas prohibiciones para comprar tiene el Art. 1229 CC?",o:["2","3","4 (tutores, mandatarios, empleados públicos, jueces)","5"],a:2,exp:"Art. 1229 CC."},
{id:282,block:9,topic:"Cosa ajena",q:"¿Qué pasa con la venta de cosa ajena?",o:["Es válida","Es nula","Es anulable","Depende"],a:1,exp:"CC. Es nula."},
{id:283,block:9,topic:"Capacidad",q:"¿Quiénes NO pueden contratar?",o:["Solo menores","Menores no emancipados, dementes, sordomudos que no escriben","Solo extranjeros","Solo discapacitados"],a:1,exp:"Código Civil."},
{id:284,block:9,topic:"Promesa",q:"¿Qué es promesa de compraventa?",o:["Verbal","Contrato preliminar para celebrar futura compraventa","Promesa unilateral","Donación"],a:1,exp:"Art. 1221 CC."},
{id:285,block:9,topic:"Promesa forma",q:"¿Forma de la promesa de inmueble?",o:["Verbal","Por escrito","Solo escritura pública","Por correo"],a:1,exp:"Art. 1221 CC. Por escrito (no requiere EP)."},
{id:286,block:9,topic:"Arras",q:"¿Qué son las arras?",o:["Comisión","Suma como señal de cumplimiento","Multa","Impuesto"],a:1,exp:"Art. 1224 CC."},
{id:287,block:9,topic:"Tipos arras",q:"¿Cuántos tipos de arras hay?",o:["Uno","Dos: confirmatorias y penitenciales","Tres","Cuatro"],a:1,exp:"Art. 1224 CC."},
{id:288,block:9,topic:"Opción",q:"¿Qué es opción de compra?",o:["Promesa","Contrato unilateral del optante de celebrar o no","Donación","Comodato"],a:1,exp:"Doctrina civil panameña."},
{id:289,block:9,topic:"Promesa vs Op",q:"¿Diferencia entre promesa y opción?",o:["Iguales","Promesa bilateral, opción unilateral","Distintos plazos","Distintos precios"],a:1,exp:"Doctrina."},
{id:290,block:9,topic:"Donación",q:"¿Qué forma debe tener la donación de inmueble?",o:["Verbal","Privada","Escritura pública","Notarial simple"],a:2,exp:"Arts. 968 ss CC."},
{id:291,block:9,topic:"Permuta",q:"¿Qué es permuta?",o:["Venta","Cada parte se obliga a dar cosa por otra","Donación","Préstamo"],a:1,exp:"Arts. 1289-1292 CC."},
{id:292,block:9,topic:"Hipoteca",q:"¿Qué es hipoteca?",o:["Mueble","Derecho real de garantía sobre inmueble","Sobre todo","Personal"],a:1,exp:"Arts. 1567 CC."},
{id:293,block:9,topic:"Anticresis",q:"¿Qué es anticresis?",o:["Hipoteca","Derecho de percibir frutos de inmueble para pagar intereses","Comodato","Prenda"],a:1,exp:"Art. 1622 CC."},
{id:294,block:9,topic:"Prenda",q:"¿La prenda aplica a inmuebles?",o:["Sí","No, solo a bienes muebles","A todo","Solo dinero"],a:1,exp:"CC. Solo muebles."},
{id:295,block:9,topic:"Comodato",q:"¿Qué es comodato?",o:["Venta","Préstamo de uso gratuito","Arrendamiento","Donación"],a:1,exp:"Arts. 1462 CC."},
{id:296,block:9,topic:"Mandato",q:"¿Qué es el mandato?",o:["Compraventa","Contrato por el cual una persona presta servicio por encargo de otra","Donación","Sociedad"],a:1,exp:"Art. 1400 CC."},
{id:297,block:9,topic:"Comisión",q:"¿Cuál es la comisión típica del CBR?",o:["1-2%","3-5% en venta (libre por mercado)","10%","20%"],a:1,exp:"Práctica de mercado. NO está fijada por ley."},
{id:298,block:9,topic:"Usucapión ord",q:"¿Cuántos años para usucapión ordinaria?",o:["10 años","15 años","20 años","30 años"],a:1,exp:"Art. 1696 CC. Quince años con justo título."},
{id:299,block:9,topic:"Usucapión ext",q:"¿Y la usucapión extraordinaria?",o:["10 años","15 años","20 años","30 años"],a:2,exp:"CC. Veinte años sin justo título."},
{id:300,block:9,topic:"Datos EP",q:"¿Qué dato debe constar en escritura?",o:["Solo precio","Precio cierto en dinero, datos partes, identificación finca","Solo finca","Solo nombres"],a:1,exp:"Manual Calificación RP."},
{id:301,block:9,topic:"Defecto venta",q:"¿Cuál es defecto común en escritura de venta?",o:["No citar precio cierto","Buena letra","Firma azul","Color papel"],a:0,exp:"Manual Calificación RP."},
{id:302,block:9,topic:"Paz y salvo",q:"¿Qué paz y salvo se requiere?",o:["Solo IDAAN","Inmuebles, IDAAN, MIVIOT en PH","Solo Inmuebles","Solo Municipio"],a:1,exp:"Múltiples paz y salvos: Inmuebles (DGI), IDAAN, MIVIOT (en PH)."},
{id:303,block:9,topic:"DE 228/2023",q:"¿Qué pago previo introdujo el DE 228/2023?",o:["B/.10","B/.5 por finca a ANATI","B/.50","B/.100"],a:1,exp:"DE 228/2023. B/.5 por finca a ANATI."},
{id:304,block:9,topic:"Soc comprar",q:"¿Quién autoriza compra en sociedad anónima?",o:["Accionistas","Junta Directiva","Cualquier socio","Asamblea siempre"],a:1,exp:"Manual Calificación. La JD compra."},
{id:305,block:9,topic:"Soc vender",q:"¿Quién autoriza venta de inmueble por sociedad?",o:["Junta Directiva","Accionistas (salvo pacto)","Solo presidente","Cualquier socio"],a:1,exp:"Manual Calificación. Los accionistas autorizan ventas."},
{id:306,block:9,topic:"Carta Pago",q:"¿Cuándo se requiere Carta de Pago Irrevocable?",o:["Siempre","Cuando hay hipoteca a cancelar","Nunca","Solo en venta con financiamiento"],a:1,exp:"Práctica financiera."},
{id:307,block:9,topic:"Cert RP",q:"¿Vigencia del certificado RP de sociedad?",o:["30 días","60 días","90 días","1 año"],a:2,exp:"Práctica registral. Noventa días."},
{id:308,block:9,topic:"Antec PN",q:"¿Vigencia antecedentes penales personas naturales?",o:["1 mes","3 meses","6 meses","1 año"],a:1,exp:"Práctica. Tres meses."},
{id:309,block:9,topic:"Antec PJ",q:"¿Y para directores de personas jurídicas?",o:["3 meses","6 meses","1 año","2 años"],a:1,exp:"Seis meses para directores PJ."},
{id:310,block:9,topic:"Desglose",q:"¿Qué exige Ley 66/2017 sobre el precio en EP?",o:["Solo monto total","Desglose terreno y mejoras","Solo terreno","Solo mejoras"],a:1,exp:"Ley 66/2017."},
{id:311,block:9,topic:"Promesa RP",q:"¿Puede inscribirse la promesa en RP?",o:["No","Sí, para protección frente a terceros","Obligatoriamente","Solo si pagada"],a:1,exp:"Manual Calificación RP. Optativa para oponibilidad."},
{id:312,block:9,topic:"ITBI base",q:"¿Cuál es la base imponible del ITBI?",o:["Solo precio venta","Solo catastral","El mayor entre venta o catastral","La diferencia"],a:2,exp:"Ley 106/1974. Sobre el MAYOR. Evita subvaluaciones."},
{id:313,block:9,topic:"Donación cónyuges",q:"¿Está exenta de ITBI la donación entre cónyuges?",o:["No","Sí, con Resolución de la DGI","A veces","Solo de padres a hijos"],a:1,exp:"Ley 106/1974. Exención previa Resolución DGI."},
{id:314,block:9,topic:"ITBI cuándo",q:"¿Cuándo se paga el ITBI?",o:["Después de inscribir","Una sola vez, previo a la firma de la EP","En cuotas","Anual"],a:1,exp:"Una sola vez antes de la firma de la EP."},
{id:315,block:9,topic:"Sucesión",q:"¿Pueden los herederos inscribir bienes que no inscribió el causante?",o:["Sí","No, deben inscribirse antes a nombre del difunto","Solo si pasaron 5 años","Con autorización"],a:1,exp:"Manual Calificación RP. Tracto sucesivo."},
{id:316,block:10,topic:"Catastral actualizado",q:"Inmueble comprado en B/.150,000 el 17/08/2007, vendido en B/.205,000 el 12/05/2022. ¿Cuál es el valor catastral actualizado al momento de la venta?",ctx:"Fórmula: Precio compra × (1 + (años transcurridos × 5%)). Los años se cuentan: año venta - año compra - 1.",o:["B/.225,000","B/.255,000","B/.275,000","B/.300,000"],a:1,exp:"PASO 1 — Años transcurridos: 2022 - 2007 - 1 = 14 años (se resta 1 porque el primer año no cuenta). PASO 2 — Incremento: 14 × 5% = 70%. PASO 3 — B/.150,000 × 1.70 = B/.255,000. ESE es el valor catastral actualizado."},
{id:317,block:10,topic:"ITBI catastral mayor",q:"Continuando: compra B/.150,000 (2007), venta B/.205,000 (2022), catastral actualizado B/.255,000. ¿Cuánto ITBI al 2%?",ctx:"El ITBI se aplica sobre el MAYOR entre precio de venta y valor catastral actualizado.",o:["B/.4,100","B/.5,100","B/.6,150","B/.10,250"],a:1,exp:"PASO 1 — Identificar MAYOR: venta B/.205,000 vs catastral actualizado B/.255,000 → gana el catastral. PASO 2 — Aplicar 2%: B/.255,000 × 0.02 = B/.5,100. Pregunta clásica: el principio del 'mayor valor'."},
{id:318,block:10,topic:"GC 10 vs 3",q:"Mismo caso (compra B/.150,000 en 2007, venta B/.205,000 en 2022). ¿Le conviene al vendedor pagar 10% sobre la ganancia o 3% del precio de venta?",ctx:"El vendedor puede optar por pagar el 3% del precio de venta como anticipo, o el 10% sobre la ganancia. Se elige el MENOR.",o:["10% sobre ganancia (B/.5,500)","3% sobre venta (B/.6,150)","10% sobre venta","Ambos son iguales"],a:0,exp:"OPCIÓN A — 10% × ganancia: ganancia = B/.205,000 - B/.150,000 = B/.55,000. 10% × B/.55,000 = B/.5,500. OPCIÓN B — 3% × precio venta: B/.205,000 × 0.03 = B/.6,150. CONVIENE el 10% (B/.5,500). Tip: cuando la ganancia es pequeña, conviene el 10%."},
{id:319,block:10,topic:"Catastral 5 años",q:"Inmueble comprado en B/.180,000 el 15/03/2016, vendido en B/.195,000 el 12/10/2022. ¿Cuál es el valor catastral actualizado?",ctx:"Recuerda: años = año venta - año compra - 1.",o:["B/.198,000","B/.215,000","B/.225,000","B/.250,000"],a:2,exp:"PASO 1 — Años: 2022 - 2016 - 1 = 5 años. PASO 2 — Incremento: 5 × 5% = 25%. PASO 3 — B/.180,000 × 1.25 = B/.225,000."},
{id:320,block:10,topic:"ITBI catastral supera",q:"Compra B/.180,000 (2016). Venta B/.195,000 (2022). Catastral actualizado B/.225,000. ¿Cuál es el ITBI?",ctx:"Identifica primero el MAYOR antes de aplicar el 2%.",o:["B/.3,600","B/.3,900","B/.4,500","B/.5,000"],a:2,exp:"PASO 1 — MAYOR entre venta (B/.195,000) y catastral actualizado (B/.225,000) = B/.225,000. PASO 2 — 2% × B/.225,000 = B/.4,500. Aquí el catastral es mayor, por eso se usa el catastral."},
{id:321,block:10,topic:"Venta supera catastral",q:"Compra B/.180,000 (2016), catastral actualizado B/.225,000, vendido en B/.240,000 (2022). ¿Cuál es el ITBI 2%?",ctx:"Cuando el precio de venta es SUPERIOR al catastral actualizado, se usa el precio de venta como base.",o:["B/.4,500","B/.4,800","B/.5,000","B/.6,000"],a:1,exp:"PASO 1 — MAYOR: venta (B/.240,000) vs catastral (B/.225,000) = B/.240,000. PASO 2 — 2% × B/.240,000 = B/.4,800. Aquí gana el precio de venta."},
{id:322,block:10,topic:"GC con 60K",q:"Compra B/.180,000 (2016), venta B/.240,000 (2022). ¿Conviene 10% sobre ganancia o 3% del precio?",ctx:"Compara las dos opciones y elige la menor.",o:["10% (B/.6,000)","3% (B/.7,200)","Son iguales","No aplica"],a:0,exp:"OPCIÓN A — 10% × (B/.240,000 - B/.180,000) = 10% × B/.60,000 = B/.6,000. OPCIÓN B — 3% × B/.240,000 = B/.7,200. CONVIENE el 10% (ahorro B/.1,200)."},
{id:323,block:10,topic:"Catastral baja ganancia",q:"Compra B/.110,000 en 2016, vendida en B/.240,000 en 2022. ¿Cuál es el valor catastral actualizado?",ctx:"Aplica la fórmula con cuidado.",o:["B/.130,000","B/.137,500","B/.145,000","B/.150,000"],a:1,exp:"PASO 1 — Años: 2022 - 2016 - 1 = 5 años. PASO 2 — Incremento: 25%. PASO 3 — B/.110,000 × 1.25 = B/.137,500."},
{id:324,block:10,topic:"GC alta ganancia",q:"Compra B/.110,000 (2016), venta B/.240,000 (2022). ¿Conviene 10% o 3%?",ctx:"Cuando la ganancia es ALTA en relación al precio, suele convenir el 3%.",o:["10% (B/.13,000)","3% (B/.7,200)","Son iguales","Ninguno aplica"],a:1,exp:"OPCIÓN A — 10% × (B/.240,000 - B/.110,000) = 10% × B/.130,000 = B/.13,000. OPCIÓN B — 3% × B/.240,000 = B/.7,200. CONVIENE el 3% (ahorro B/.5,800). REGLA: si la ganancia supera el 30% del precio de venta, usualmente conviene el 3%."},
{id:325,block:10,topic:"PFT cálculo",q:"Una vivienda principal (PFT/VP) tiene valor catastral de B/.350,000. ¿Cuál es el Impuesto de Inmuebles anual?",ctx:"PFT/VP: exento hasta B/.120,000; 0.5% de B/.120,001 a B/.700,000; 0.7% sobre exceso de B/.700,000.",o:["B/.1,150","B/.1,500","B/.1,750","B/.2,450"],a:0,exp:"PASO 1 — Exento: primeros B/.120,000 → B/.0. PASO 2 — Tramo 0.5%: (B/.350,000 - B/.120,000) = B/.230,000 × 0.5% = B/.1,150. TOTAL: B/.1,150."},
{id:326,block:10,topic:"Comisión",q:"Una venta cierra en B/.250,000. La comisión pactada es del 5%. ¿Cuánto recibe el corredor antes de impuestos?",ctx:"La comisión típica de venta es 3-5%. No fijada por ley.",o:["B/.10,000","B/.12,500","B/.15,000","B/.20,000"],a:1,exp:"B/.250,000 × 5% = B/.12,500. Comisión bruta antes del ISR personal del corredor."},
{id:327,block:10,topic:"Vendedor neto",q:"Si una venta cierra en B/.300,000 y el catastral actualizado es B/.280,000, ¿cuánto pagará el vendedor por ITBI 2% y cuánto recibe neto si la comisión es 5%?",ctx:"El ITBI lo paga el VENDEDOR. La comisión también la paga el vendedor (típicamente).",o:["ITBI B/.5,600 / Neto B/.279,400","ITBI B/.6,000 / Neto B/.279,000","ITBI B/.6,000 / Neto B/.285,000","ITBI B/.5,600 / Neto B/.285,000"],a:1,exp:"PASO 1 — ITBI: MAYOR es B/.300,000 (venta supera catastral). 2% × B/.300,000 = B/.6,000. PASO 2 — Comisión: 5% × B/.300,000 = B/.15,000. PASO 3 — Neto: B/.300,000 - B/.6,000 - B/.15,000 = B/.279,000. (Falta sumar la decisión de Ganancia Capital)."},
{id:328,block:3,topic:"Tipos de contrato MIVIOT",q:"¿Qué tipo de contrato MIVIOT corresponde a un arrendamiento habitacional de hasta B/.750 mensuales?",ctx:"El MIVIOT clasifica los contratos por destino y monto. Memoriza los tres tipos.",o:["Tipo A — habitacional de interés social (3 años prorrogables)","Tipo B — habitacional general","Tipo C — comercial","Tipo D — turístico"],a:0,exp:"Tipo A es el habitacional de interés social, hasta B/.750/mes, con plazo de 3 años prorrogables automáticamente. Tipo B es habitacional sobre B/.750/mes. Tipo C es comercial, industrial o profesional."},
{id:329,block:3,topic:"Tipo C contrato",q:"El contrato MIVIOT Tipo C aplica a:",o:["Arrendamiento habitacional de interés social","Arrendamiento habitacional sobre B/.750","Arrendamiento comercial, industrial o profesional","Arrendamiento turístico"],a:2,exp:"Tipo C es para arrendamiento comercial, industrial o profesional. En este tipo el arrendatario paga ITBMS al arrendador, quien debe depositarlo al Estado dentro de los 15 días siguientes a la recaudación."},
{id:330,block:3,topic:"Formularios MIVIOT",q:"¿Cuántos formularios oficiales del MIVIOT existen para arrendamiento?",o:["Uno solo (contrato unificado)","Dos (contrato y depósito)","Tres (contrato, consignación de depósito, devolución de depósito)","Cuatro"],a:2,exp:"Tres formularios: (1) Formato de contrato Tipo A/B/C, (2) Consignación del depósito, (3) Solicitud de devolución del depósito. Cada formulario cuesta B/.0.50."},
{id:331,block:3,topic:"Multa no registro",q:"¿Cuál es la multa por no registrar el contrato de arrendamiento en el MIVIOT?",ctx:"El arrendador debe registrar el contrato dentro de los 5 días hábiles siguientes a su firma.",o:["B/.100","5 veces el valor del depósito","10 veces el valor del depósito","B/.1,000 fijos"],a:2,exp:"La multa es 10 veces el valor del depósito de garantía. Esto incentiva fuertemente al arrendador a registrar el contrato a tiempo."},
{id:332,block:3,topic:"Tácita reconducción",q:"¿Qué significa 'tácita reconducción' en arrendamientos?",o:["La obligación de devolver el inmueble al término","Prorrogar el contrato por tiempo indefinido cuando ninguna parte se opone al vencimiento","Renunciar al derecho de prórroga","Subrogar al arrendatario"],a:1,exp:"Tácita reconducción: si al vencimiento del contrato el arrendatario continúa en posesión del inmueble sin oposición del arrendador, el contrato se prorroga por tiempo indefinido bajo las mismas condiciones (excepto el plazo)."},
{id:333,block:3,topic:"No discriminación",q:"Según la Ley 93/1973, ¿cuál NO es razón válida para negar un arrendamiento?",ctx:"El arrendamiento es de orden público; no se puede discriminar.",o:["Falta de capacidad de pago documentada","Raza, sexo, edad, credo religioso o tener niños","Antecedentes negativos en arrendamientos previos","Que el inmueble esté reservado"],a:1,exp:"La Ley 93/1973 prohíbe negar el arrendamiento por raza, estado civil, sexo, nacionalidad, edad, color, credo político o religioso, o por tener niños. Es una protección antidiscriminación."},
{id:334,block:3,topic:"Diligente padre de familia",q:"El arrendatario está obligado a usar el inmueble como un:",o:["Propietario absoluto","Diligente padre de familia","Administrador delegado","Usuario casual"],a:1,exp:"El estándar legal del Código Civil es 'diligente padre de familia': cuidar el inmueble como si fuera propio, dándole un uso razonable y conservándolo en buen estado."},
{id:335,block:3,topic:"Visitas del arrendador",q:"¿En qué condiciones puede el arrendador visitar el inmueble arrendado?",o:["Cuando lo desee, sin previo aviso","Solo con orden judicial","En horas diurnas y con previo aviso, para reparaciones de desgaste y uso","Solo el último día del mes"],a:2,exp:"El arrendatario debe permitir al arrendador visitas en horas diurnas y con previo aviso, para realizar reparaciones necesarias del desgaste y uso. Esto balancea la propiedad del arrendador con la posesión pacífica del arrendatario."},
{id:336,block:3,topic:"Timbres",q:"¿Quién paga los timbres de un contrato de arrendamiento?",o:["El arrendador","El arrendatario","Se reparten 50/50","El MIVIOT"],a:1,exp:"Los timbres del contrato los paga el arrendatario, sin excepción (jubilados, diplomáticos y arrendatarios en general pagan timbres)."},
{id:337,block:3,topic:"Cálculo timbres",q:"Fórmula para calcular los timbres de un contrato de arrendamiento:",ctx:"Pregunta de cálculo típica del examen.",o:["Canon mensual ÷ 1,000","Canon mensual × meses del contrato ÷ 1,000","Canon mensual × 12","Canon × 5%"],a:1,exp:"Timbres = (canon mensual × meses totales del contrato) ÷ 1,000. Ejemplo: contrato de 3 años con canon de B/.150/mes → 150 × 36 = 5,400 ÷ 1,000 = B/.5.40 en timbres."},
{id:338,block:3,topic:"Cálculo canon inversión",q:"Fórmula práctica para calcular el canon de arrendamiento como inversión:",ctx:"Cálculo común en el examen para evaluar rentabilidad.",o:["(Costo del inmueble × 10%) ÷ 12 meses","(Costo del inmueble × 15%) ÷ 12 meses","Costo del inmueble × 5% mensual","(Costo × 20%) ÷ 12"],a:1,exp:"Canon = (Costo del inmueble × 15%) ÷ 12 meses. Ejemplo: inmueble de B/.50,000 → 50,000 × 15% = 7,500 ÷ 12 = B/.625/mes. Esta es una regla de mercado para retorno anual del 15% sobre la inversión."},
{id:339,block:3,topic:"Banco depósito",q:"¿En qué banco se consigna el depósito de garantía del arrendamiento?",ctx:"La Ley 259/2021 cambió este aspecto importante.",o:["Cualquier banco comercial","Banco Nacional de Panamá","MIVIOT directamente","Banco General"],a:1,exp:"Banco Nacional de Panamá (también la Caja de Ahorros). La Ley 259/2021 modificó el Art. 13 de la Ley 93/1973 para que el depósito vaya a banco autorizado, separado de las cuentas operativas del MIVIOT."},
{id:340,block:3,topic:"Depósito diplomático",q:"¿Quién solicita al MIVIOT la exoneración del depósito de arrendamiento de un diplomático?",o:["El propio diplomático","El Ministerio de Relaciones Exteriores","La embajada acreditante","El propietario del inmueble"],a:1,exp:"El Ministerio de Relaciones Exteriores tramita la exoneración del depósito para personal diplomático ante el MIVIOT."},
{id:341,block:3,topic:"Contrato comercial ITBMS",q:"En un contrato Tipo C (comercial), el arrendador debe depositar el ITBMS al Estado dentro de:",o:["5 días","10 días","15 días siguientes a la recaudación","30 días"],a:2,exp:"El arrendador tiene 15 días siguientes a la recaudación para depositar el ITBMS al Estado, en los contratos comerciales (Tipo C)."},
{id:342,block:1,topic:"Resolución 007/2007",q:"¿Qué Resolución regula el reglamento interno y composición de funciones de la JTBR?",o:["Resolución 1/2001","Resolución 6/2004","Resolución 007 del 6 de marzo de 2007","Resolución 39/2001"],a:2,exp:"La Resolución 007 del 6 de marzo de 2007 regula el reglamento interno, la composición de funciones y el inicio de funciones de la JTBR. Complementa al DL 6/1999 y el DE 39/2001."},
{id:343,block:1,topic:"Ley MIVIOT",q:"¿Qué ley creó el Ministerio de Vivienda (MIVI/MIVIOT)?",o:["Ley 6 de 2006","Ley 9 del 25 de enero de 1973","Ley 93 de 1973","Ley 41 de 2004"],a:1,exp:"Ley 9 del 25 de enero de 1973 creó el Ministerio de Vivienda (MIVI), hoy Ministerio de Vivienda y Ordenamiento Territorial (MIVIOT) tras absorber competencias de ordenamiento."},
{id:344,block:1,topic:"Gremios JTBR",q:"¿Qué requisito de antigüedad debe cumplir una asociación que aspira a estar representada en la JTBR?",o:["1 año de personería jurídica","5 años de personería jurídica","10 años de personería jurídica","Sin requisito específico"],a:2,exp:"La asociación o gremio aspirante debe tener personería jurídica con al menos 10 años de antigüedad para integrar la terna de representantes gremiales."},
{id:345,block:1,topic:"Secretario JTBR",q:"¿Quién nombra al secretario(a) de actas y correspondencia de la JTBR?",o:["El MICI directamente","El Director del Comercio Interior del MICI","La JTBR por mayoría","El Órgano Ejecutivo"],a:1,exp:"El Director del Comercio Interior del MICI nombra al secretario(a) de actas y correspondencia del Departamento de Secretaría de la JTBR."},
{id:346,block:1,topic:"Renovación fianza",q:"¿Cada cuánto debe renovarse la fianza del CBR?",o:["Cada 6 meses","Anualmente, dentro de los 30 días anteriores a su vencimiento","Cada 2 años","Solo cuando la JTBR lo solicite"],a:1,exp:"La fianza se renueva anualmente, dentro de los 30 días anteriores a su vencimiento. Si no se renueva, la licencia se suspende provisionalmente por 6 meses; si transcurre ese plazo sin renovar, se cancela."},
{id:347,block:1,topic:"Suspensión por fianza",q:"¿Qué sucede si el CBR no renueva su fianza a tiempo?",o:["Multa inmediata de B/.10,000","Suspensión provisional por 6 meses; cancelación si transcurre ese plazo sin renovar","Cancelación inmediata","Solo amonestación verbal"],a:1,exp:"Suspensión provisional por 6 meses. Si transcurre ese plazo sin que el CBR cumpla con la renovación, la licencia se cancela."},
{id:348,block:1,topic:"Fianza beneficiario",q:"¿A nombre de quién se constituye la fianza del CBR?",o:["Del cliente de cada operación","A favor del MICI","A favor de la JTBR","A favor del MEF"],a:1,exp:"La fianza de B/.10,000 se constituye a favor (o a nombre) del MICI, ya que es ante este Ministerio que el CBR responde por su ejercicio profesional."},
{id:349,block:1,topic:"Código Ética estructura",q:"El Código de Ética del CBR (Resolución 2/2001) tiene:",o:["1 título y 15 artículos","2 títulos y 30 artículos","5 títulos y 50 artículos","10 capítulos y 100 artículos"],a:1,exp:"Dos títulos y treinta artículos. Título I (Régimen de Conducta, 5 capítulos): conducta e imagen del CBR. Título II (Régimen Disciplinario, 1 capítulo): sanciones."},
{id:350,block:1,topic:"Fraude",q:"Las representaciones falsas, propaganda engañosa y exageración configuran:",o:["Negligencia profesional","Fraude","Falta administrativa menor","Conducta privada del CBR"],a:1,exp:"Fraude. El Código de Ética del CBR considera fraude cualquier representación falsa, propaganda engañosa o exageración respecto del inmueble o la operación."},
{id:351,block:1,topic:"Mandato",q:"¿Cómo se llama la autorización que el propietario otorga al CBR para recibir dinero como abono al alquiler o venta?",o:["Promesa de venta","Contrato de Mandato","Carta de garantía","Poder general"],a:1,exp:"Contrato de Mandato. Es la autorización formal mediante la cual el propietario faculta al CBR a recibir dinero (abonos, arras, depósitos) en nombre del propietario."},
{id:352,block:1,topic:"Falta de ética",q:"¿Cuál de las siguientes ES considerada una falta al Código de Ética del CBR?",ctx:"El Código de Ética protege la lealtad entre colegas.",o:["Anunciar un inmueble en exclusiva con autorización","Compartir comisión con el colega que gestionó el negocio","Contactar al cliente de un colega sin su autorización","Asistir a capacitaciones de la JTBR"],a:2,exp:"Contactar al cliente de un colega sin autorización es falta de ética. También: dar información anticipada sin solicitud previa del colega y no compartir comisión con quien gestionó el negocio."},
{id:353,block:1,topic:"Sanciones Código Ética",q:"¿Cuáles son sanciones contempladas en el Código de Ética del CBR?",o:["Solo multas en dinero","Cárcel y multas","Amonestación (verbal o escrita), suspensión temporal o cancelación de la licencia","Solo cancelación inmediata"],a:2,exp:"El Código de Ética contempla: amonestación verbal y privada, amonestación escrita (privada o pública), suspensión temporal de la licencia y cancelación de la licencia. Las multas en dinero NO son sanciones del Código de Ética sino del DL 6/1999."},
{id:354,block:1,topic:"Pruebas denuncia",q:"Una vez recibidos los descargos en una denuncia, ¿cuál es el plazo para que la JTBR practique pruebas?",o:["5 días fijos","No menos de 8 ni más de 20 días hábiles","Hasta 60 días","30 días fijos"],a:1,exp:"No menos de 8 ni mayor de 20 días hábiles para practicar pruebas tras los descargos. La JTBR fija el plazo dentro de ese rango según la complejidad del caso."},
{id:355,block:1,topic:"Alegatos denuncia",q:"¿Qué tiempo tienen denunciante y denunciado para presentar alegatos?",o:["2 días hábiles","5 días hábiles","10 días hábiles","15 días hábiles"],a:1,exp:"Cinco días hábiles para presentar alegatos finales antes de que la JTBR proceda a resolver."},
{id:356,block:1,topic:"Gaceta Oficial",q:"Una vez ejecutoriada la resolución de sanción al CBR, ¿dónde se publica?",o:["Diario La Prensa","Página web del MICI","Gaceta Oficial","No se publica"],a:2,exp:"La resolución sancionatoria ejecutoriada se publica en la Gaceta Oficial, periódico oficial del Estado panameño, dándole publicidad y oponibilidad frente a terceros."},
{id:357,block:1,topic:"Récord PJ",q:"¿Cuál es la vigencia del récord policivo de los directivos de una persona jurídica para la JTBR?",ctx:"Diferentes vigencias para PN y PJ.",o:["1 mes","3 meses (igual que PN)","6 meses","1 año"],a:2,exp:"Para personas jurídicas: 6 meses (récord policivo de cada directivo). Para personas naturales: 3 meses. Aunque el papel del récord dice '1 mes' de vigencia, para la JTBR aplican estos plazos extendidos."},
{id:358,block:9,topic:"Precarista",q:"¿Cuál es la diferencia entre 'precarista' e 'invasor'?",ctx:"Conceptos clave del derecho posesorio en Panamá.",o:["Son sinónimos","Precarista invade terreno del Estado; invasor invade terreno privado","Precarista invade privado; invasor invade del Estado","Precarista tiene contrato; invasor no"],a:1,exp:"Precarista: ocupa terreno del Estado sin título. Invasor: ocupa terreno privado sin permiso del propietario. La distinción es importante porque el régimen procesal y administrativo es distinto."},
{id:359,block:9,topic:"Perjurio",q:"¿Cómo se denomina jurídicamente la declaración falsa de demolición de una edificación?",o:["Estafa","Perjurio","Falsificación documental","Apropiación indebida"],a:1,exp:"Perjurio: declaración falsa hecha bajo juramento o ante autoridad competente. Aplicado a la demolición, declarar falsamente que se demolió una edificación constituye perjurio (de 'perjuro' = mentir bajo juramento)."},
{id:360,block:9,topic:"Minuta de venta",q:"En un contrato de compraventa de inmueble, ¿quién revisa la minuta (proyecto de escritura) que se firmará en notaría?",o:["El CBR que medió la operación","El abogado","El notario directamente","El Registro Público"],a:1,exp:"El abogado revisa la minuta de venta antes de su firma. El notario autoriza el acto, pero la revisión técnica del contenido corresponde al abogado de cada parte. El CBR no debe asumir esta función legal."},
{id:361,block:9,topic:"Agente residente",q:"¿Quién actúa como agente residente de una persona jurídica panameña?",o:["El CBR cuando es PJ","El abogado","El representante legal","Cualquier directivo"],a:1,exp:"El abogado es el agente residente de toda persona jurídica panameña. Es requisito para la inscripción y mantenimiento de la sociedad en el Registro Público."},
{id:362,block:9,topic:"Honorarios CBR",q:"¿Quién paga los honorarios del Corredor de Bienes Raíces?",ctx:"Pregunta importante: el pago no está fijado por ley.",o:["Siempre el comprador","Siempre el vendedor","Quien lo contrate (puede ser comprador, vendedor o ambos)","Se reparten 50/50"],a:2,exp:"Quien contrata al CBR paga sus honorarios. En la práctica usualmente lo paga el vendedor, pero la regla legal es: paga quien lo contrata. La comisión y quién la asume se pactan libremente."},
{id:363,block:5,topic:"Tierra insular",q:"¿Qué es una tierra insular?",ctx:"Concepto base del régimen de la Ley 2 de 2006.",o:["Una isla","Un terreno costero en tierra firme","Un terreno con vista al mar","Una propiedad cerca del Canal"],a:0,exp:"Tierra insular es una isla. La Ley 2 de 2006 regula las concesiones administrativas para el aprovechamiento turístico de tierras insulares y costas continentales del Estado."},
{id:364,block:5,topic:"Concesión insular — quién escoge",q:"¿Quién escoge las tierras del estado insular para darlas en concesión administrativa de aprovechamiento turístico?",o:["El MIVIOT","El Órgano Ejecutivo (Consejo de Gabinete)","ANATI","El municipio donde está la isla"],a:1,exp:"El Órgano Ejecutivo, a través del Consejo de Gabinete, es quien identifica y escoge las tierras insulares del Estado que serán dadas en concesión para aprovechamiento turístico."},
{id:365,block:5,topic:"Concesión insular — convocatoria",q:"¿Quién hace las convocatorias, establece los valores y confecciona los contratos de tierra del estado insular para concesión turística?",o:["ANATI","MIVIOT","MEF (Ministerio de Economía y Finanzas)","ATP (Autoridad de Turismo)"],a:2,exp:"El MEF (Ministerio de Economía y Finanzas) hace las convocatorias, establece los valores de los cánones y confecciona los contratos de concesión sobre tierras insulares del Estado."},
{id:366,block:5,topic:"Concesión insular — perfeccionamiento",q:"¿Cómo se perfecciona el contrato de concesión sobre tierras del estado insular?",o:["Con la firma de las partes únicamente","Con la inscripción en el Registro Público","Con la firma o refrendo (aprobación) de la Contraloría General de la República","Con publicación en Gaceta Oficial"],a:2,exp:"El contrato se perfecciona con la firma o refrendo de la Contraloría General de la República. Sin este refrendo el contrato no produce efectos legales — es un control de legalidad obligatorio para todo contrato del Estado."},
{id:367,block:5,topic:"Plazo concesión insular",q:"¿Por cuál período se da en concesión las tierras del estado insular para aprovechamiento turístico?",ctx:"Memoriza el plazo base y el máximo con prórroga.",o:["20 años, prorrogable a 40","40 años, prorrogable hasta 70 años máximo (40 + 30 de prórroga)","30 años fijos sin prórroga","99 años"],a:1,exp:"40 años de plazo base, con posibilidad de prórroga de hasta 30 años más, dando un máximo de 70 años. La extensión se otorga según la magnitud y la importancia del proyecto turístico."},
{id:368,block:5,topic:"Prórroga concesión insular",q:"¿Cuál es el período máximo de prórroga adicional que se puede dar en la concesión de tierra insular del estado para aprovechamiento turístico?",o:["10 años","20 años","30 años","40 años"],a:2,exp:"30 años máximo de prórroga adicional al plazo inicial de 40 años. Total máximo: 70 años. Esto permite proyectos turísticos a largo plazo con suficiente tiempo para amortizar inversión."},
{id:369,block:5,topic:"Concesiones comarcas indígenas",q:"¿Quién otorga las concesiones de tierras ubicadas en áreas de comarcas indígenas?",ctx:"Importante para distinguir jurisdicciones.",o:["El Estado central directamente","Las autoridades comarcales (congresos generales)","ANATI con autorización del MIVIOT","El MEF"],a:1,exp:"Las autoridades comarcales (los congresos generales de cada comarca) son quienes otorgan las concesiones sobre tierras ubicadas dentro de las áreas comarcales indígenas. Las comarcas tienen autonomía territorial reconocida por ley."},
{id:370,block:5,topic:"Enajenación insular",q:"¿Cuál es el porcentaje máximo de enajenación (separación/concesión) de la tierra insular del estado dada para aprovechamiento turístico?",o:["30% del área total de la isla","50% de lo que mide toda la isla","70% del área total","100% del área total"],a:1,exp:"Hasta el 50% del área total de la isla. El otro 50% debe permanecer bajo dominio del Estado, asegurando que la concesión no abarque toda la isla y se preserven áreas de uso público o de conservación."},
{id:371,block:5,topic:"% edificación insular",q:"¿Cuál es el porcentaje máximo de edificación en la concesión de tierra insular del estado?",ctx:"Calcula sobre el área concesionada (50% de la isla).",o:["10% del área concesionada","30% del área concesionada (que es el 50% del tamaño total de la isla)","50% del área concesionada","100% del área concesionada"],a:1,exp:"Solo el 30% del área concesionada puede ser edificada. Como la concesión máxima es 50% de la isla, las edificaciones no pueden cubrir más del 30% de ese 50% — es decir, máximo 15% del área total de la isla."},
{id:372,block:5,topic:"Visión paisajística",q:"¿Cuál es el porcentaje mínimo de área que debe quedar libre de edificación para preservar la visión paisajística en concesiones de tierras insulares del estado?",o:["10% del área concesionada","20%","30% mínimo libre de edificación para visión paisajística","50%"],a:2,exp:"Mínimo 30% del área concesionada debe quedar libre de edificación, reservada para preservar la visión paisajística. Esto protege el atractivo turístico y el valor ambiental de la isla."},
{id:373,block:5,topic:"Definición de playa",q:"¿Cómo se denomina el área que queda al descubierto una vez que baja la marea?",ctx:"Conceptos básicos del régimen costero.",o:["Ribera de playa","Playa","Zona marítimo-terrestre","Litoral"],a:1,exp:"Playa es el área que queda al descubierto al bajar la marea — entre la línea de marea baja y la línea de marea alta. Es bien de uso público, inalienable e imprescriptible."},
{id:374,block:5,topic:"Ribera de playa",q:"¿Cómo se le denomina al área de arena seca, contigua a la playa, hacia tierra firme?",o:["Ribera de playa (arena seca)","Litoral marino","Bien insular","Servidumbre eléctrica"],a:0,exp:"Ribera de playa es el área de arena seca contigua a la playa hacia tierra adentro. Junto con la servidumbre de 22 metros desde la línea de marea alta, forma parte del régimen de protección costera."},
{id:375,block:6,topic:"Prescripción impuesto inmuebles",q:"Si un contribuyente del impuesto de inmuebles no ha pagado este impuesto, ¿cuántos años deben transcurrir para que prescriba (el MEF lo condone)?",ctx:"Regla de prescripción tributaria.",o:["3 años","5 años","7 años","10 años"],a:3,exp:"10 años. Es el plazo de prescripción para que el MEF condone (declare extinguida) la deuda del impuesto de inmuebles no pagado. Pasados 10 años sin que el Estado cobre, el contribuyente queda liberado de la obligación."},
{id:376,block:6,topic:"Declaración jurada",q:"¿Qué es una declaración jurada?",o:["Una declaración hecha bajo juramento ante un juez","Una manifestación por escrito en la que se da fe de que lo declarado es real y verdadero","Un certificado emitido por el Registro Público","Una factura sellada por la DGI"],a:1,exp:"Una declaración jurada es una manifestación por escrito en la que la persona da fe de que lo declarado es real y verdadero. Las declaraciones falsas constituyen perjurio. En materia tributaria es la forma habitual de presentar información ante la DGI."},
{id:377,block:6,topic:"Autoconstructor 5 años",q:"Si una persona construye ella misma su bien inmueble y lo vende dentro de los 5 años de haberlo construido, ¿qué impuesto de transferencia debe pagar?",ctx:"Régimen del autoconstructor (no aplicable a promotores con giro inmobiliario habitual).",o:["ITBI completo del 2%","Solo el 1% de ITBI","Ninguno (ITBI no aplica al autoconstructor que vende su propia obra)","ITBI del 2% más Ganancia de Capital del 10%"],a:2,exp:"Cuando una persona natural construye su propio inmueble (autoconstructor, sin giro inmobiliario habitual) y lo vende, no se considera transferencia gravable con ITBI en los términos típicos. La Ganancia de Capital sí podría aplicar si hay ganancia. Importante: este criterio es distinto al promotor inmobiliario con giro habitual, quien sí paga ITBI sobre todas sus ventas."},
];

import {
  GraduationCap, BookOpen, Calculator, Library, BarChart3, AlertCircle,
  Home, ChevronRight, ChevronLeft, ArrowRight, ArrowLeft,
  CheckCircle2, XCircle, Check, X, Trophy, Target,
  Building2, FileText, Shield, DollarSign, Map,
  Lightbulb, Info, Zap, RotateCcw,
  ListChecks, Layers, Brain, Sparkles, ScrollText,
  Landmark, Scale, Compass, BookMarked, FlaskConical,
  Quote, Eye, RefreshCw, Clock, Award,
  TrendingUp, FileBadge2, Gavel, Receipt, Globe2, Mountain,
  CircleDollarSign, Percent, ChevronsRight, Sun, Moon, Sunrise,
} from 'lucide-react';

const BLOCK_ICONS = {
  1: Landmark, 2: Shield, 3: BookMarked, 4: Building2, 5: Mountain,
  6: Receipt, 7: Globe2, 8: Layers, 9: Scale, 10: Calculator,
};

const RESOURCE_ICONS = {
  jtbr_organo: Landmark,
  jtbr_licencia: FileBadge2,
  jtbr_sanciones: Gavel,
  blanqueo_marco: Shield,
  blanqueo_dd: ListChecks,
  blanqueo_pep: AlertCircle,
  arr_marco: BookMarked,
  arr_obligaciones: Scale,
  arr_desahucio: XCircle,
  urb_ley6: Map,
  urb_residencial: Building2,
  urb_comercial: Building2,
  urb_servidumbres: Compass,
  tier_concesiones: Mountain,
  tier_titulacion: FileText,
  tier_casco: Landmark,
  imp_pft: Receipt,
  imp_itbi_gc: Percent,
  imp_catastral: TrendingUp,
  imp_credito: CircleDollarSign,
  zon_zlc: Globe2,
  zon_zf: Globe2,
  zon_pp: Globe2,
  ph_ley284: Layers,
  ph_construccion: Building2,
  tur_incentivos: Sparkles,
  cont_compraventa: Scale,
  cont_otros: Scale,
  cont_documentos: FileText,
  calc_formulas: Calculator,
};

const RESOURCES = {
  // BLOQUE 1
  jtbr_organo: {
    block: 1,
    title: "Órgano regulador y composición",
    subtitle: "DL 6/1999 · DE 39/2001",
    desc: "El Decreto Ley 6 de 1999 crea la JTBR como órgano regulador del corretaje en Panamá, adscrito al MICI. Sus 5 miembros incluyen 3 ministerios y 2 gremiales. Las normas se complementan con el Código de Comercio (no Civil) cuando hay vacíos legales, conforme al Art. 19 del DL 6/1999.",
    tables: [
      {
        title: "Composición de la JTBR — 5 miembros",
        cols: ["Cargo", "Quién", "Período"],
        rows: [
          ["Presidencia", "Ministro del MICI o su designado", "Mientras dure el cargo"],
          ["Miembro", "Ministro del MIVIOT o su designado", "Mientras dure el cargo"],
          ["Miembro", "Ministro del MEF o su designado", "Mientras dure el cargo"],
          ["Gremial 1", "Designado por el Ejecutivo de terna gremial", "3 años"],
          ["Gremial 2", "Designado por el Ejecutivo de terna gremial", "3 años"],
        ],
      },
      {
        title: "Quórum y decisiones",
        cols: ["Concepto", "Valor"],
        rows: [
          ["Quórum mínimo", "3 miembros"],
          ["Decisiones", "Por mayoría simple"],
          ["Reuniones ordinarias", "Mensuales"],
          ["Adscripción", "Ministerio de Comercio e Industrias (MICI)"],
        ],
      },
      {
        title: "Funciones principales",
        cols: ["#", "Función"],
        rows: [
          ["1", "Otorgar, suspender, cancelar y reinstalar licencias"],
          ["2", "Vigilar el cumplimiento de la ley por parte de los CBR"],
          ["3", "Investigar denuncias y aplicar sanciones"],
          ["4", "Regular el ejercicio profesional"],
          ["5", "Aprobar reglamentos internos"],
          ["6", "Coordinar con gremios y otras autoridades"],
        ],
      },
      {
        title: "Norma supletoria",
        cols: ["Vacío legal", "Aplica"],
        rows: [
          ["DL 6/1999 — vacíos", "Código de Comercio (Art. 19 DL 6/1999)"],
          ["NO aplica supletoriamente", "Código Civil (error común)"],
        ],
      },
    ],
  },
  jtbr_licencia: {
    block: 1,
    title: "Licencia de Corredor",
    subtitle: "Bloque 1 · Requisitos y vigencia",
    desc: "Para ejercer como CBR se requiere licencia expedida por la JTBR. Existen requisitos para personas naturales y para personas jurídicas. La fianza de B/.10,000 es requisito permanente. Hay un caso especial de exención del examen para quienes tengan 10 años continuos de ejercicio del corretaje.",
    tables: [
      {
        title: "Requisitos persona natural",
        cols: ["Requisito", "Detalle"],
        rows: [
          ["Nacionalidad", "Panameño O extranjero con 5 años de residencia permanente"],
          ["Edad", "Mayor de edad"],
          ["Examen de idoneidad", "Mínimo 71% para aprobar"],
          ["Fianza", "B/.10,000"],
          ["Timbres", "B/.25"],
          ["Buena conducta", "Sin antecedentes penales"],
          ["Vigencia", "Permanente sujeta a cumplimiento"],
        ],
      },
      {
        title: "Requisitos persona jurídica",
        cols: ["Requisito", "Detalle"],
        rows: [
          ["Constitución", "Sociedad inscrita en RP de Panamá"],
          ["Objeto social", "Debe incluir corretaje de bienes raíces"],
          ["Representante legal", "DEBE ser CBR con licencia vigente"],
          ["Fianza", "B/.10,000"],
          ["Timbres", "B/.25"],
        ],
      },
      {
        title: "Exención del examen",
        cols: ["Caso", "Requisito"],
        rows: [
          ["Ejercicio previo", "10 años continuos del corretaje al momento de la solicitud"],
          ["Comprobación", "Certificaciones, contratos, recibos, testimonios"],
        ],
      },
      {
        title: "Plazos administrativos",
        cols: ["Acto", "Plazo"],
        rows: [
          ["Expedir licencia", "30 días hábiles"],
          ["Reconsideración (recurso)", "10 días hábiles"],
          ["Manifestar impedimento", "2 días"],
          ["Pronunciamiento sobre impedimento", "3 días"],
          ["Descargo a denuncia", "10 días"],
          ["Resolución de denuncia", "2 meses"],
        ],
      },
    ],
  },
  jtbr_sanciones: {
    block: 1,
    title: "Sanciones y suspensión",
    subtitle: "Bloque 1 · Régimen sancionador",
    desc: "El régimen sancionador de la JTBR incluye multas, suspensión, cancelación y reinstalación de licencias. Ejercer corretaje sin licencia tiene la multa máxima de B/.10,000. La suspensión máxima es 6 meses; la cancelación va de 1 a 10 años; la reinstalación máxima 1 año.",
    tables: [
      {
        title: "Tipos de sanciones",
        cols: ["Sanción", "Plazo / Monto"],
        rows: [
          ["Multas generales", "B/.100 a B/.10,000 según gravedad"],
          ["Multa máxima — sin licencia", "B/.10,000"],
          ["Suspensión", "Hasta 6 meses"],
          ["Cancelación", "1 a 10 años"],
          ["Reinstalación máxima", "1 año"],
          ["Régimen transitorio histórico", "6 meses (DT del DL)"],
        ],
      },
      {
        title: "Causales de cancelación",
        cols: ["#", "Causal"],
        rows: [
          ["1", "Reincidencia en faltas graves"],
          ["2", "Condena penal por delito doloso"],
          ["3", "Quiebra dolosa o fraudulenta"],
          ["4", "Manejo doloso de fondos de clientes"],
          ["5", "No mantener la fianza vigente"],
          ["6", "Permitir uso de licencia por tercero"],
        ],
      },
      {
        title: "Procedimiento sancionatorio",
        cols: ["Paso", "Detalle"],
        rows: [
          ["1. Denuncia", "Cualquier interesado o de oficio"],
          ["2. Admisión", "JTBR examina la denuncia"],
          ["3. Notificación", "Al CBR denunciado para descargo"],
          ["4. Descargo", "10 días para responder"],
          ["5. Pruebas", "Período probatorio"],
          ["6. Resolución", "2 meses máximo"],
          ["7. Recurso", "Reconsideración 10 días hábiles"],
        ],
      },
    ],
  },
  // BLOQUE 2
  blanqueo_marco: {
    block: 2,
    title: "Marco legal del blanqueo",
    subtitle: "Bloque 2 · Ley 23/2015 + 124/2020 + 254/2021",
    desc: "Como CBR eres Sujeto Obligado No Financiero (SONF), específicamente bajo el numeral 3 del Art. 40 de la Ley 124/2020. Te supervisa la SSNF (Superintendencia, NO Intendencia). Las sanciones bajo Ley 254/2021 van de B/.5,000 a B/.5,000,000. Toda la información debe resguardarse 5 años.",
    tables: [
      {
        title: "Normas vigentes",
        cols: ["Ley", "Año", "Materia"],
        rows: [
          ["Ley 23", "2015", "Marco general de prevención de blanqueo"],
          ["Ley 124", "2020", "Crea la SSNF y define SONF"],
          ["Ley 254", "2021", "Sanciones reforzadas y reorganiza Comisión Nacional"],
          ["Ley 121", "2013", "Conservación de información"],
        ],
      },
      {
        title: "Comisión Nacional contra el Blanqueo",
        cols: ["Concepto", "Valor"],
        rows: [
          ["Miembros", "9 (Ley 254/2021)"],
          ["Quórum", "5 miembros"],
          ["Mayoría para decisiones", "5 votos"],
          ["Presidencia", "Ministro del MEF o designado"],
          ["Secretaría Técnica", "UAF (Unidad de Análisis Financiero)"],
        ],
      },
      {
        title: "Cifras y plazos clave",
        cols: ["Concepto", "Valor"],
        rows: [
          ["Reporte de operaciones en efectivo", "Desde B/.10,000"],
          ["Reporte de Operación Sospechosa (ROS)", "Sin umbral, inmediato"],
          ["Resguardo de documentos", "5 años"],
          ["PEP — vigencia tras cese", "2 años"],
          ["Sanción mínima Ley 254", "B/.5,000"],
          ["Sanción máxima Ley 254", "B/.5,000,000"],
        ],
      },
      {
        title: "CBR como sujeto obligado",
        cols: ["Concepto", "Detalle"],
        rows: [
          ["Categoría", "Sujeto Obligado No Financiero (SONF)"],
          ["Norma específica", "Art. 40, numeral 3, Ley 124/2020"],
          ["Supervisor", "SSNF (Superintendencia)"],
          ["Obligación principal", "DD + Manual de Prevención + Oficial de Cumplimiento"],
        ],
      },
    ],
  },
  blanqueo_dd: {
    block: 2,
    title: "Debida diligencia",
    subtitle: "Bloque 2 · DDS, DDD, DDA",
    desc: "La debida diligencia es el conjunto de medidas para conocer al cliente y al beneficiario final. Existen tres niveles según el riesgo: simplificada, documental y ampliada. La elección depende del perfil del cliente, montos, origen de fondos y otros factores de riesgo.",
    tables: [
      {
        title: "Niveles de Debida Diligencia",
        cols: ["Nivel", "Sigla", "Cuándo aplica"],
        rows: [
          ["Simplificada", "DDS", "Cliente de bajo riesgo y operaciones rutinarias"],
          ["Documental", "DDD", "Cliente estándar / riesgo medio (la mayoría)"],
          ["Ampliada", "DDA", "Alto riesgo: PEP, países no cooperantes, montos elevados"],
        ],
      },
      {
        title: "Información mínima a recabar",
        cols: ["#", "Información"],
        rows: [
          ["1", "Identificación con cédula o pasaporte vigente"],
          ["2", "Domicilio comprobado"],
          ["3", "Actividad económica y origen de fondos"],
          ["4", "Identidad del beneficiario final"],
          ["5", "Propósito de la operación"],
          ["6", "Vínculos PEP (si aplica)"],
          ["7", "Coincidencia con listas de sancionados (OFAC, ONU, UE)"],
        ],
      },
      {
        title: "Documentos del Manual",
        cols: ["#", "Documento"],
        rows: [
          ["1", "Manual de Prevención de Blanqueo"],
          ["2", "Política Conozca a su Cliente (KYC)"],
          ["3", "Designación del Oficial de Cumplimiento"],
          ["4", "Matriz de riesgos por cliente"],
          ["5", "Programa anual de capacitación"],
          ["6", "Procedimientos de monitoreo continuo"],
        ],
      },
    ],
  },
  blanqueo_pep: {
    block: 2,
    title: "PEP y operaciones sospechosas",
    subtitle: "Bloque 2 · Personas Expuestas Políticamente",
    desc: "Los PEP son funcionarios públicos de alto nivel y sus familiares cercanos. Requieren Debida Diligencia Ampliada (DDA). Esta condición se mantiene 2 años después del cese del cargo. Las operaciones sospechosas se reportan a la UAF mediante el ROS, sin umbral y de manera inmediata.",
    tables: [
      {
        title: "Quiénes son PEP",
        cols: ["#", "Categoría"],
        rows: [
          ["1", "Jefes de Estado o de gobierno"],
          ["2", "Ministros, viceministros, altos funcionarios"],
          ["3", "Magistrados de Corte Suprema y tribunales superiores"],
          ["4", "Diputados (asambleístas)"],
          ["5", "Embajadores y altos diplomáticos"],
          ["6", "Oficiales superiores de fuerzas armadas"],
          ["7", "Directivos de empresas estatales"],
          ["8", "Miembros de partidos políticos (alta jerarquía)"],
          ["9", "Familiares cercanos y allegados"],
        ],
      },
      {
        title: "Tratamiento de PEP",
        cols: ["Concepto", "Detalle"],
        rows: [
          ["Nivel de DD", "DDA — Ampliada"],
          ["Aprobación interna", "Alta gerencia"],
          ["Origen de fondos", "Documentación reforzada"],
          ["Monitoreo", "Continuo durante toda la relación"],
          ["Vigencia tras cese", "2 años"],
          ["Familiares", "Cónyuge, padres, hijos, hermanos, suegros"],
        ],
      },
      {
        title: "ROS — Reporte de Operación Sospechosa",
        cols: ["Concepto", "Valor"],
        rows: [
          ["Umbral", "Sin umbral — toda sospecha se reporta"],
          ["Plazo", "Inmediato al detectar la sospecha"],
          ["A quién se reporta", "UAF (Unidad de Análisis Financiero)"],
          ["Confidencialidad", "Estricta — prohibido alertar al cliente"],
          ["Conservación", "5 años"],
        ],
      },
      {
        title: "Señales de alerta",
        cols: ["#", "Señal"],
        rows: [
          ["1", "Pago en efectivo desproporcionado"],
          ["2", "Cliente reacio a documentar origen de fondos"],
          ["3", "Estructuras complejas sin justificación económica"],
          ["4", "Operación sin sentido económico aparente"],
          ["5", "Uso de testaferros o intermediarios sin razón"],
          ["6", "Compraventa muy bajo o muy alto valor de mercado"],
        ],
      },
    ],
  },
  // BLOQUE 3
  arr_marco: {
    block: 3,
    title: "Marco legal del arrendamiento",
    subtitle: "Bloque 3 · Ley 93/1973 + Ley 259/2021",
    desc: "El arrendamiento residencial está regulado por la Ley 93 de 1973 y sus reformas, principalmente la Ley 259 de 2021. La autoridad competente es la DGA (Dirección General de Arrendamientos) del MIVIOT. El depósito equivale a un canon mensual y se deposita en BNP o Caja de Ahorros (NO en MIVIOT).",
    tables: [
      {
        title: "Normas vigentes",
        cols: ["Norma", "Año", "Materia"],
        rows: [
          ["Ley 93", "1973", "Marco general del arrendamiento"],
          ["Decreto 6", "1989", "Reglamento de la Ley 93"],
          ["Ley 259", "2021", "Reforma — modernización del arrendamiento"],
          ["Ley 22", "2024", "Ajustes complementarios"],
        ],
      },
      {
        title: "Plazos clave",
        cols: ["Concepto", "Plazo"],
        rows: [
          ["Plazo mínimo del contrato", "3 años + prórroga"],
          ["Aviso de desocupar (arrendatario)", "30 días calendario"],
          ["Copia del contrato a DGA", "5 días hábiles"],
          ["Mora para iniciar lanzamiento", "2 meses"],
          ["Preferencia de compra (PH)", "90 días"],
          ["Resolución Comisión de Vivienda", "15 días hábiles"],
        ],
      },
      {
        title: "Depósito de garantía",
        cols: ["Concepto", "Detalle"],
        rows: [
          ["Monto", "Equivalente a 1 canon mensual"],
          ["Dónde se deposita", "Banco Nacional de Panamá (BNP) o Caja de Ahorros"],
          ["Quién deposita", "El propietario / arrendador"],
          ["Devolución", "Al término del contrato si no hay daños ni mora"],
          ["Plazo devolución", "30 días"],
          ["Genera intereses", "Sí, a favor del arrendatario"],
          ["NO se deposita en", "MIVIOT (error común)"],
        ],
      },
      {
        title: "Excluidos del régimen",
        cols: ["#", "Excluido"],
        rows: [
          ["1", "Apart-hoteles y hospedajes turísticos"],
          ["2", "Inmuebles cuyo canon excede límite legal"],
          ["3", "Arrendamientos comerciales puros"],
          ["4", "Vivienda gratuita o por cargo laboral"],
        ],
      },
    ],
  },
  arr_obligaciones: {
    block: 3,
    title: "Obligaciones de las partes",
    subtitle: "Bloque 3 · Arrendador y arrendatario",
    desc: "El contrato de arrendamiento crea obligaciones recíprocas. El arrendador debe entregar el inmueble en buen estado y mantenerlo. El arrendatario debe pagar puntualmente, conservar el inmueble y devolverlo. Las reparaciones se distribuyen según su naturaleza: mayores al arrendador, locativas al arrendatario.",
    tables: [
      {
        title: "Obligaciones del arrendador",
        cols: ["#", "Obligación"],
        rows: [
          ["1", "Entregar el inmueble en buen estado de habitabilidad"],
          ["2", "Mantener el inmueble apto durante el contrato"],
          ["3", "Garantizar el uso pacífico del inmueble"],
          ["4", "Realizar reparaciones mayores y estructurales"],
          ["5", "Pagar el impuesto de inmuebles"],
          ["6", "Devolver el depósito al final del contrato"],
          ["7", "Registrar el contrato en la DGA"],
        ],
      },
      {
        title: "Obligaciones del arrendatario",
        cols: ["#", "Obligación"],
        rows: [
          ["1", "Pagar el canon en la fecha pactada"],
          ["2", "Usar el inmueble conforme al destino convenido"],
          ["3", "Conservar el inmueble en buen estado"],
          ["4", "Realizar reparaciones menores (locativas)"],
          ["5", "Permitir inspecciones razonables"],
          ["6", "Pagar servicios públicos a su nombre"],
          ["7", "Devolver el inmueble al término del contrato"],
          ["8", "Avisar 30 días antes de desocupar"],
        ],
      },
      {
        title: "Tipos de reparación",
        cols: ["Tipo", "Quién paga", "Ejemplos"],
        rows: [
          ["Mayores / estructurales", "Arrendador", "Techo, paredes maestras, instalación eléctrica completa, plomería principal"],
          ["Menores / locativas", "Arrendatario", "Bombillas, llaves, manijas, pintura por uso, trampas de drenaje"],
          ["Por daño culposo", "Quien lo causó", "Roturas, marcas, deterioro acelerado por mal uso"],
        ],
      },
    ],
  },
  arr_desahucio: {
    block: 3,
    title: "Desahucio y lanzamiento",
    subtitle: "Bloque 3 · Terminación del contrato",
    desc: "El desahucio es la terminación del contrato de arrendamiento. Procede por causales legales: mora de 2 meses, vencimiento, uso indebido, subarriendo no autorizado, entre otros. La Comisión de Vivienda del MIVIOT atiende las controversias en primera instancia, con plazo de resolución de 15 días hábiles.",
    tables: [
      {
        title: "Causales de desahucio",
        cols: ["#", "Causal"],
        rows: [
          ["1", "Mora en el pago de 2 mensualidades"],
          ["2", "Vencimiento del contrato sin prórroga"],
          ["3", "Uso distinto al pactado"],
          ["4", "Subarriendo no autorizado"],
          ["5", "Daños graves al inmueble"],
          ["6", "Necesidad propia del propietario (con causal)"],
          ["7", "Demolición o reconstrucción mayor"],
          ["8", "Venta del inmueble (con preferencia)"],
        ],
      },
      {
        title: "Procedimiento de lanzamiento",
        cols: ["Paso", "Detalle"],
        rows: [
          ["1. Demanda", "Ante Comisión de Vivienda (MIVIOT)"],
          ["2. Notificación", "Al arrendatario para defensa"],
          ["3. Audiencia", "Pruebas y conciliación"],
          ["4. Resolución", "15 días hábiles"],
          ["5. Recurso", "Reconsideración o apelación según el caso"],
          ["6. Ejecución", "Lanzamiento con apoyo policial si necesario"],
        ],
      },
      {
        title: "Comisión de Vivienda — autoridad",
        cols: ["Concepto", "Detalle"],
        rows: [
          ["Adscripción", "MIVIOT — Ministerio de Vivienda"],
          ["Competencia", "Controversias arrendamiento residencial"],
          ["Plazo de resolución", "15 días hábiles"],
          ["Recursos", "Reconsideración, apelación a la Dirección"],
        ],
      },
    ],
  },
  // BLOQUE 4
  urb_ley6: {
    block: 4,
    title: "Marco urbanístico — Ley 6/2006",
    subtitle: "Bloque 4 · Ordenamiento territorial",
    desc: "La Ley 6 de 2006 reglamenta el ordenamiento territorial para el desarrollo urbano. El MIVIOT es la autoridad rectora. Cada municipio aprueba su Plan Regulador. Las zonificaciones determinan usos permitidos. La Resolución MIVIOT 169 de 2004 detalla las categorías residenciales, comerciales e industriales.",
    tables: [
      {
        title: "Autoridades urbanísticas",
        cols: ["Autoridad", "Función"],
        rows: [
          ["MIVIOT", "Rector nacional, normativa, planos reguladores"],
          ["Municipios", "Aprueban planos reguladores locales"],
          ["MiAmbiente", "Estudios de impacto ambiental"],
          ["ANATI", "Tierras nacionales y patrimoniales"],
          ["Bomberos", "Permisos de seguridad"],
        ],
      },
      {
        title: "Instrumentos normativos",
        cols: ["Instrumento", "Alcance"],
        rows: [
          ["Plan Nacional de Ordenamiento Territorial", "Nacional"],
          ["Plan Regulador", "Municipal o distrital"],
          ["Plan Parcial", "Sectorial / proyecto"],
          ["Esquema de zonificación", "Específico"],
          ["Resolución 169/2004", "Categorías de zonificación"],
        ],
      },
      {
        title: "Permisos clave",
        cols: ["Permiso", "Otorga", "Para"],
        rows: [
          ["Anteproyecto", "MIVIOT", "Aprobación general del diseño"],
          ["Plano", "MIVIOT / Municipio", "Aprobación del proyecto"],
          ["Construcción", "Municipio", "Iniciar la obra"],
          ["Ocupación", "Municipio", "Habitar el inmueble terminado"],
          ["Demolición", "Municipio", "Derribar estructura"],
        ],
      },
    ],
  },
  urb_residencial: {
    block: 4,
    title: "Zonificación residencial",
    subtitle: "Bloque 4 · Resolución 169/2004",
    desc: "Las zonas residenciales se categorizan por densidad poblacional (habitantes/hectárea) y lote mínimo. Memoriza el orden ascendente: R-R, R1-A, R1-B, R2-A, R2-B, R-3, R-E, R-M, RM-1, RM-2, RM-3. La R2-B y superiores permiten apartamentos. RM-2 y RM-3 no tienen restricción de altura.",
    tables: [
      {
        title: "Zonas residenciales completas",
        cols: ["Código", "Tipo", "Densidad", "Lote mín.", "Notas"],
        rows: [
          ["R-R", "Rural", "50 hab/ha", "1,000 m²", "Suburbana / agrícola. Planta baja + 2 altos. Retiro lateral 3 m"],
          ["R1-A", "Baja", "100 hab/ha", "800 m² uni / 400 m² bi", "Unifamiliar y bifamiliar. Retiro lateral 2.5 m"],
          ["R1-B", "Baja", "200 hab/ha", "600 m² / 300 m²", "Permite bifamiliar adosada. Verde mín 30%"],
          ["R2-A", "Mediana", "300 hab/ha", "600 m² uni / 200 m² hilera", "NO permite apartamentos. Hasta planta baja + 2 altos"],
          ["R2-B", "Mediana", "300 hab/ha", "600 m² apto", "PERMITE APARTAMENTOS. Planta baja + 3 altos"],
          ["R-3", "Mediana", "400 hab/ha", "400 m² uni / 150 m² hilera", "Unifamiliar, bifamiliar, hilera y apartamentos"],
          ["R-E", "Mediana especial", "500 hab/ha", "160 m²", "Hilera y apartamentos"],
          ["R-M", "Alta", "600 hab/ha", "600 m² apto", "Multifamiliar. Planta baja + 2 altos en hilera"],
          ["RM-1", "Alta", "750 hab/ha", "600 m²", "Multifamiliar. Altura según densidad"],
          ["RM-2", "Alta", "1,000 hab/ha", "800 m²", "Multifamiliar. Sin restricción de altura"],
          ["RM-3", "Alta MÁXIMA", "1,500 hab/ha", "800 m²", "MÁXIMA densidad. Sin restricción de altura"],
        ],
      },
      {
        title: "Reglas que se memorizan",
        cols: ["Regla", "Detalle"],
        rows: [
          ["Apartamentos permitidos desde", "R2-B en adelante"],
          ["Sin restricción de altura desde", "RM-2 y RM-3"],
          ["Densidad máxima permitida", "1,500 hab/ha (RM-3)"],
          ["Lote más grande exigido", "1,000 m² (R-R)"],
          ["Lote más pequeño residencial", "150 m² (R-3 hilera)"],
        ],
      },
    ],
  },
  urb_comercial: {
    block: 4,
    title: "Zonas comerciales e industriales",
    subtitle: "Bloque 4 · C-1, C-2, IL, IM, IP",
    desc: "Las zonas comerciales se dividen en C-1 (vecinal/baja intensidad) y C-2 (urbana/alta intensidad). Las industriales en IL (liviana), IM (mediana/molesta) e IP (pesada/peligrosa). Las IP requieren permisos adicionales de Bomberos, MiAmbiente y Salud por su naturaleza peligrosa.",
    tables: [
      {
        title: "Zonas comerciales",
        cols: ["Código", "Tipo", "Ejemplos"],
        rows: [
          ["C-1", "Vecinal / baja intensidad", "Abarroterías, kioscos, panaderías, boutiques, lavamáticos, barberías, salones de belleza, oficinas residentes, talleres pequeños"],
          ["C-2", "Urbana / alta intensidad", "Supermercados, centros comerciales, gasolineras, restaurantes, discotecas, bancos, oficinas, almacenes, talleres, hoteles, teatros, cines"],
        ],
      },
      {
        title: "Zonas industriales",
        cols: ["Código", "Tipo", "Ejemplos", "Permisos"],
        rows: [
          ["IL", "Liviana", "Confites, hielo, imprentas, ropa, espejos, helados, maletas, carteras", "Permisos básicos"],
          ["IM", "Mediana / molesta", "Aceites, gaseosas, cerámicas, colchones, condimentos, harina pescado, puertas y ventanas", "Permisos ampliados"],
          ["IP", "Pesada / peligrosa", "Explosivos, gases comprimidos, oxígeno, acetileno, gas propano, inflamables, pinturas, refinerías", "Bomberos + MiAmbiente + Salud"],
        ],
      },
      {
        title: "Áreas especiales y otras",
        cols: ["Código", "Significado"],
        rows: [
          ["PV", "Pulmón Verde — áreas verdes y parques"],
          ["AE", "Áreas Especiales (revertidas, históricas)"],
          ["EP", "Equipamiento Público / espacio público"],
          ["SIU", "Servicios e Infraestructura Urbana"],
          ["R-C", "Residencial de Conjunto (urbanizaciones cerradas)"],
        ],
      },
    ],
  },
  urb_servidumbres: {
    block: 4,
    title: "Servidumbres y retiros",
    subtitle: "Bloque 4 · Restricciones constructivas",
    desc: "Las servidumbres son cargas sobre un predio en favor de otro o del público. Los retiros son distancias mínimas obligatorias entre la construcción y el lindero. Limitan el área construible pero protegen luz, ventilación, vialidad y ambiente.",
    tables: [
      {
        title: "Tipos de servidumbres",
        cols: ["Tipo", "Naturaleza"],
        rows: [
          ["Públicas", "Establecidas por ley en favor del Estado o el público"],
          ["Privadas", "Constituidas por contrato entre particulares"],
          ["De paso", "Acceso a finca enclavada"],
          ["De acueducto", "Conducción de agua"],
          ["De vista / luces", "Restricción de aberturas"],
          ["Eléctricas", "Líneas de transmisión"],
        ],
      },
      {
        title: "Retiros típicos",
        cols: ["Tipo", "Distancia mín."],
        rows: [
          ["Frontal R1-A", "5 metros"],
          ["Lateral R1-A", "2.5 metros"],
          ["Posterior", "3 metros (típico)"],
          ["Lateral R-R", "3 metros"],
          ["Vías nacionales", "Según MOP"],
          ["Quebradas / ríos", "10 m de ribera"],
          ["Costas", "22 m según ley costas"],
        ],
      },
      {
        title: "Áreas verdes obligatorias",
        cols: ["Tipo de proyecto", "% mínimo"],
        rows: [
          ["Urbanización R1-B", "30% del área libre"],
          ["Multifamiliar", "Según plan regulador"],
          ["Cesión a municipio", "10% del área bruta (típico)"],
        ],
      },
    ],
  },
  // BLOQUE 5
  tier_concesiones: {
    block: 5,
    title: "Concesiones de tierras",
    subtitle: "Bloque 5 · ANATI",
    desc: "ANATI (Autoridad Nacional de Administración de Tierras) gestiona las tierras nacionales y patrimoniales. Las concesiones son derechos de uso temporal sobre tierras del Estado. La titulación masiva ha avanzado desde la creación de ANATI en 2010. El DE 228/2023 fija un pago previo de B/.5 por finca.",
    tables: [
      {
        title: "Tipos de tierras",
        cols: ["Tipo", "Naturaleza"],
        rows: [
          ["Nacionales", "Pertenecen al Estado, sin titular privado"],
          ["Patrimoniales", "Del Estado pero registradas a su nombre"],
          ["Privadas", "Tituladas a nombre de particulares"],
          ["Indígenas / comarcales", "Régimen especial de comarcas"],
          ["Costas y riberas", "Bienes de uso público"],
        ],
      },
      {
        title: "Concesiones — generalidades",
        cols: ["Concepto", "Detalle"],
        rows: [
          ["Naturaleza", "Derecho temporal de uso"],
          ["Otorga", "ANATI o autoridad sectorial"],
          ["Plazo típico", "20 años, prorrogable"],
          ["Canon", "Fijado por ley o reglamento"],
          ["Transferible", "Con autorización"],
          ["Reversión", "A favor del Estado al término"],
        ],
      },
      {
        title: "Pago previo ANATI",
        cols: ["Concepto", "Valor"],
        rows: [
          ["Norma", "DE 228/2023"],
          ["Pago previo", "B/.5 por finca"],
          ["Concepto", "Trámites de titulación"],
          ["Adicional", "Tasas según el trámite específico"],
        ],
      },
    ],
  },
  tier_titulacion: {
    block: 5,
    title: "Titulación de tierras",
    subtitle: "Bloque 5 · Procedimiento ANATI",
    desc: "La titulación es el proceso para convertir una posesión en propiedad inscrita en el Registro Público. ANATI lidera los procesos masivos. El procedimiento incluye levantamiento topográfico, inspección, publicación, oposición y resolución. Como alternativa existe la usucapión judicial (15 o 20 años).",
    tables: [
      {
        title: "Procedimiento de titulación",
        cols: ["Paso", "Detalle"],
        rows: [
          ["1. Solicitud", "Ante ANATI con declaración de posesión"],
          ["2. Inspección", "Verificación de campo"],
          ["3. Plano", "Levantamiento topográfico aprobado"],
          ["4. Avalúo", "Valoración del predio"],
          ["5. Pago", "Tasas y precio (si aplica)"],
          ["6. Publicación", "Edicto para oposiciones"],
          ["7. Resolución", "Adjudicación si no hay oposición"],
          ["8. Inscripción", "Registro Público"],
        ],
      },
      {
        title: "Usucapión — alternativa judicial",
        cols: ["Tipo", "Plazo", "Requisitos"],
        rows: [
          ["Ordinaria", "15 años", "Posesión con justo título y buena fe"],
          ["Extraordinaria", "20 años", "Posesión continua, pacífica y pública"],
          ["Bienes comunales", "No procede", "Imprescriptibles"],
          ["Bienes públicos", "No procede", "Imprescriptibles"],
        ],
      },
      {
        title: "Bienes patrimoniales — Ley 80/2009",
        cols: ["Concepto", "Detalle"],
        rows: [
          ["Norma", "Ley 80 de 2009"],
          ["Naturaleza", "Bienes del Estado registrados a su nombre"],
          ["Diferencia con nacionales", "Ya están inscritos"],
          ["Disponibilidad", "Pueden ser enajenados según ley"],
        ],
      },
    ],
  },
  tier_casco: {
    block: 5,
    title: "Casco Antiguo",
    subtitle: "Bloque 5 · Decreto Ley 9 de 1997",
    desc: "El Casco Antiguo (San Felipe) es Patrimonio de la Humanidad UNESCO desde 1997. Goza de un régimen especial con incentivos fiscales para su preservación: 30 años de exoneración del impuesto de inmuebles. La Oficina del Casco Antiguo gestiona los permisos.",
    tables: [
      {
        title: "Régimen general",
        cols: ["Concepto", "Detalle"],
        rows: [
          ["Norma rectora", "DL 9 de 1997"],
          ["Reconocimiento internacional", "UNESCO Patrimonio de la Humanidad (1997)"],
          ["Autoridad", "Oficina del Casco Antiguo"],
          ["Adscripción", "MIVIOT"],
          ["Alcance geográfico", "San Felipe, Casco Antiguo de Panamá"],
        ],
      },
      {
        title: "Incentivos fiscales",
        cols: ["Beneficio", "Plazo"],
        rows: [
          ["Exoneración impuesto inmuebles", "30 años"],
          ["Exoneración derechos importación", "Materiales de restauración"],
          ["Crédito fiscal", "Inversión en restauración"],
          ["ITBI reducido", "Para primeras transferencias post-restauración"],
        ],
      },
      {
        title: "Permisos especiales",
        cols: ["Permiso", "Otorga"],
        rows: [
          ["Restauración", "Oficina del Casco Antiguo"],
          ["Demolición", "Excepcional, con análisis patrimonial"],
          ["Cambio de fachada", "Sujeto a normas estrictas"],
          ["Uso comercial", "Compatible con preservación"],
          ["Hospedajes", "Cumplir normas turismo + casco"],
        ],
      },
    ],
  },
  // BLOQUE 6
  imp_pft: {
    block: 6,
    title: "Patrimonio Familiar y Vivienda Principal",
    subtitle: "Bloque 6 · Ley 66/2017",
    desc: "El PFT (Patrimonio Familiar Tributario, con familia bajo mismo techo) y la VP (Vivienda Principal, persona natural sola) reciben el tratamiento tributario más favorable. Para acceder a estas tarifas, el inmueble debe estar registrado como tal en el portal e-Tax 2.0 de la DGI. Exento hasta B/.120,000.",
    tables: [
      {
        title: "Tarifas PFT / VP",
        cols: ["Tramo de valor catastral", "Tarifa", "Cálculo"],
        rows: [
          ["Hasta B/.120,000", "0% — EXENTO", "Sin impuesto"],
          ["B/.120,001 a B/.700,000", "0.5%", "Sobre la fracción que exceda B/.120,000"],
          ["Más de B/.700,000", "0.7%", "Sobre la fracción que exceda B/.700,000"],
        ],
      },
      {
        title: "Tarifas Otros Inmuebles (no PFT/VP)",
        cols: ["Tramo", "Tarifa"],
        rows: [
          ["Hasta B/.30,000", "0% — EXENTO"],
          ["B/.30,001 a B/.250,000", "0.6%"],
          ["B/.250,001 a B/.500,000", "0.8%"],
          ["Más de B/.500,000", "1.0%"],
        ],
      },
      {
        title: "Diferencia PFT vs VP",
        cols: ["Concepto", "PFT", "VP"],
        rows: [
          ["Quién", "Familia bajo mismo techo", "Persona natural sola"],
          ["Inmuebles", "Solo el principal", "Solo el principal"],
          ["Tarifas", "Iguales", "Iguales"],
          ["Registro", "Portal e-Tax 2.0", "Portal e-Tax 2.0"],
        ],
      },
      {
        title: "Exoneraciones especiales",
        cols: ["Beneficiario", "Hasta"],
        rows: [
          ["Estado, embajadas, iglesias, beneficencia", "Total"],
          ["Vivienda principal de discapacitado (Ley 43/1999)", "B/.250,000 catastral"],
          ["Fincas agropecuarias (valor menor a B/.500,000)", "5 años + 5 años prórroga"],
          ["Casco Antiguo (DL 9/1997)", "30 años"],
        ],
      },
    ],
  },
  imp_itbi_gc: {
    block: 6,
    title: "ITBI y Ganancia de Capital",
    subtitle: "Bloque 6 · Impuestos en transferencia",
    desc: "Los dos impuestos centrales en una venta de inmueble son el ITBI (2%, lo paga el vendedor) y la Ganancia de Capital (10% sobre ganancia o 3% del precio, lo que sea menor). El comprador no debería asumir estos costos: cualquier cláusula que traslade el ITBI al comprador es nula.",
    tables: [
      {
        title: "ITBI — Impuesto de Transferencia",
        cols: ["Concepto", "Valor"],
        rows: [
          ["Tasa", "2%"],
          ["Base", "El MAYOR entre precio de venta o catastral actualizado"],
          ["Quien paga", "VENDEDOR (cláusula que lo traslade es nula)"],
          ["Cuándo", "Antes de la firma de la EP, una sola vez"],
          ["Formulario", "106 (DGI)"],
          ["Norma", "Ley 106/1974 + reformas"],
        ],
      },
      {
        title: "Ganancia de Capital",
        cols: ["Concepto", "Valor"],
        rows: [
          ["Tasa nominal", "10% sobre la ganancia neta"],
          ["Anticipo", "3% del MAYOR entre precio de venta o catastral"],
          ["Quien paga", "Vendedor"],
          ["Opción legal", "Pagar solo el 3% si es menor que el 10% real"],
          ["Formulario", "107 (DGI)"],
          ["Crédito tributario", "Si el 3% pagado supera el 10% real"],
        ],
      },
      {
        title: "Cuándo conviene 3% vs 10%",
        cols: ["Caso", "Conviene"],
        rows: [
          ["Ganancia alta (precio venta mucho mayor que compra)", "10% sobre ganancia (menor)"],
          ["Ganancia baja o sin ganancia", "3% del precio de venta (límite)"],
          ["Pérdida en la venta", "3% del precio (porque 10% sería negativo)"],
        ],
      },
    ],
  },
  imp_catastral: {
    block: 6,
    title: "Catastral actualizado",
    subtitle: "Bloque 6 · Fórmula y cálculo",
    desc: "El valor catastral actualizado se calcula con una fórmula simple: precio de compra multiplicado por (1 más años transcurridos por 5%). Los años se cuentan restando 1 al diferencial: año venta menos año compra menos 1. Es la base mínima para ITBI cuando supera el precio de venta.",
    tables: [
      {
        title: "Fórmula paso a paso",
        cols: ["Paso", "Cálculo"],
        rows: [
          ["1. Años transcurridos", "Año venta menos año compra menos 1"],
          ["2. Incremento %", "Años por 5%"],
          ["3. Catastral actualizado", "Precio compra por (1 más incremento)"],
          ["4. Base ITBI", "Mayor entre precio venta y catastral actualizado"],
        ],
      },
      {
        title: "Ejemplos rápidos",
        cols: ["Compra", "Año compra", "Año venta", "Catastral act."],
        rows: [
          ["B/.150,000", "2007", "2022", "B/.255,000 (14 años x 5% = 70% incremento)"],
          ["B/.180,000", "2016", "2022", "B/.225,000 (5 años x 5% = 25% incremento)"],
          ["B/.250,000", "2010", "2022", "B/.387,500 (11 años x 5% = 55%)"],
        ],
      },
      {
        title: "Reglas de la actualización",
        cols: ["Regla", "Detalle"],
        rows: [
          ["Tasa anual", "5% fija sobre precio de compra"],
          ["Por qué se resta 1", "El año de compra no se cuenta completo"],
          ["Aplica a", "Cálculo de ITBI y como referencia GC"],
          ["Mejoras", "Pueden incrementar la base por separado"],
        ],
      },
    ],
  },
  imp_credito: {
    block: 6,
    title: "Ley 468/2025 e incentivos",
    subtitle: "Bloque 6 · Vivienda nueva e interés preferencial",
    desc: "La Ley 468 de 2025 subroga la Ley 3 de 1985 y entró en vigencia el 1 de enero de 2026. Establece un nuevo régimen de interés preferencial con tramos del 5%, 4.5% y 4%. El Estado subsidia hasta el 85% del costo financiero. La ley aplica a viviendas nuevas hasta cierto valor.",
    tables: [
      {
        title: "Ley 468/2025 — interés preferencial",
        cols: ["Tramo", "Tasa subsidiada", "Subsidio Estado"],
        rows: [
          ["Hasta B/.45,000", "5%", "Hasta 85%"],
          ["B/.45,001 a B/.80,000", "4.5%", "Variable"],
          ["B/.80,001 a B/.120,000", "4%", "Variable"],
        ],
      },
      {
        title: "Aspectos importantes Ley 468/2025",
        cols: ["Concepto", "Detalle"],
        rows: [
          ["Subroga", "Ley 3 de 1985"],
          ["Vigencia", "Desde 1 enero 2026"],
          ["Aplica a", "Vivienda nueva"],
          ["Banco intermediario", "Bancos comerciales con convenio"],
          ["Subsidio Estado", "Hasta 85% del costo financiero"],
        ],
      },
      {
        title: "Otros incentivos vigentes",
        cols: ["Norma", "Beneficio"],
        rows: [
          ["Ley 9/2024", "Fondo Solidario de Vivienda"],
          ["Ley 80/2012", "Incentivos turismo (vivienda con uso turístico)"],
          ["DL 9/1997", "Casco Antiguo — 30 años exoneración"],
          ["Ley 80/2012 — turismo Pmá", "B/.8MM mín distrito Panamá"],
          ["Ley 80/2012 — turismo fuera", "B/.250K mínimo"],
          ["Ley 80/2012 — convenciones", "B/.30MM mínimo"],
        ],
      },
    ],
  },
  // BLOQUE 7
  zon_zlc: {
    block: 7,
    title: "Zona Libre de Colón",
    subtitle: "Bloque 7 · DL 18 de 1948",
    desc: "La Zona Libre de Colón es la zona franca más antigua de América. Creada en 1948, ocupa unas 1,064 hectáreas y aloja cerca de 2,000 empresas. Sus operaciones internacionales están libres de todo impuesto, contribución y gravamen. Es modelo del concepto de zona franca regional.",
    tables: [
      {
        title: "Datos generales",
        cols: ["Concepto", "Valor"],
        rows: [
          ["Norma rectora", "DL 18 de 1948"],
          ["Ubicación", "Colón, Panamá"],
          ["Tamaño", "Aprox 1,064.5 hectáreas"],
          ["Empresas", "Aprox 2,000"],
          ["Régimen fiscal", "Libre de todo impuesto, contribución y gravamen"],
          ["Administra", "Administración de la Zona Libre"],
          ["Tipo de operación", "Re-exportación principalmente"],
        ],
      },
      {
        title: "Beneficios principales",
        cols: ["#", "Beneficio"],
        rows: [
          ["1", "Exoneración total ISR sobre operaciones exteriores"],
          ["2", "Sin ITBMS sobre operaciones de reexportación"],
          ["3", "Sin aranceles aduaneros para mercancía en tránsito"],
          ["4", "Repatriación libre de utilidades"],
          ["5", "Régimen migratorio facilitado"],
        ],
      },
    ],
  },
  zon_zf: {
    block: 7,
    title: "Zonas Francas",
    subtitle: "Bloque 7 · Ley 32 de 2011",
    desc: "La Ley 32 de 2011 establece el régimen general de Zonas Francas en Panamá. Permite crear zonas en todo el país con beneficios fiscales para actividades de manufactura, servicios y logística. Requiere mínimo 2 hectáreas e inversión inicial de B/.250,000.",
    tables: [
      {
        title: "Requisitos generales",
        cols: ["Concepto", "Valor"],
        rows: [
          ["Norma", "Ley 32 de 2011"],
          ["Reglamento vigente", "DE 62/2017"],
          ["Tamaño mínimo", "2 hectáreas"],
          ["Inversión mínima", "B/.250,000"],
          ["Plazo iniciar inversión", "1 año"],
          ["Plazo iniciar actividad", "2 años"],
        ],
      },
      {
        title: "Actividades permitidas",
        cols: ["#", "Actividad"],
        rows: [
          ["1", "Manufactura de bienes para exportación"],
          ["2", "Servicios logísticos y distribución"],
          ["3", "Centros de servicios compartidos"],
          ["4", "Investigación y desarrollo"],
          ["5", "Educación superior y entrenamiento"],
          ["6", "Centros de salud (con condiciones)"],
        ],
      },
      {
        title: "Beneficios fiscales",
        cols: ["Tributo", "Tratamiento"],
        rows: [
          ["ISR — operaciones exteriores", "Exento"],
          ["ITBI", "Exento"],
          ["ITBMS sobre exportaciones", "Exento"],
          ["Aranceles importación de equipo", "Exentos"],
          ["Impuesto inmuebles", "Exento por plazo de la concesión"],
        ],
      },
    ],
  },
  zon_pp: {
    block: 7,
    title: "Panamá-Pacífico",
    subtitle: "Bloque 7 · Ley 41 de 2004",
    desc: "Panamá-Pacífico es un régimen especial creado por la Ley 41 de 2004 para reactivar la antigua base militar de Howard. Está adscrita al Ministerio de la Presidencia, con Junta Directiva de 11 miembros (período 4 años). Régimen prácticamente libre de impuestos, con ITBI exonerado hasta el 1 de enero de 2030.",
    tables: [
      {
        title: "Datos generales",
        cols: ["Concepto", "Valor"],
        rows: [
          ["Norma", "Ley 41 de 2004"],
          ["Ubicación", "Howard, Arraiján"],
          ["Adscripción", "Ministerio de la Presidencia"],
          ["Junta Directiva — miembros", "11"],
          ["Período JD", "4 años"],
          ["Régimen", "100% libre de impuestos (con excepciones)"],
        ],
      },
      {
        title: "Plazos e incentivos clave",
        cols: ["Concepto", "Valor"],
        rows: [
          ["ITBI exoneración", "Hasta 1 enero 2030"],
          ["Importación doméstica permitida", "Hasta US$100,000 anual"],
          ["Trabajadores extranjeros máx", "10% al 15% (según tipo)"],
          ["Operación", "24/7 sin recargos"],
          ["Visa especial inversionista", "Sí"],
        ],
      },
      {
        title: "Actividades permitidas",
        cols: ["#", "Actividad"],
        rows: [
          ["1", "Centros de servicios multinacionales"],
          ["2", "Manufactura ligera y ensamblaje"],
          ["3", "Logística y carga aérea"],
          ["4", "Tecnología e investigación"],
          ["5", "Servicios financieros internacionales"],
          ["6", "Cinematografía y audiovisuales"],
        ],
      },
    ],
  },
  // BLOQUE 8
  ph_ley284: {
    block: 8,
    title: "Propiedad Horizontal — Ley 284/2022",
    subtitle: "Bloque 8 · Régimen de PH",
    desc: "La Ley 284 de 2022 reorganiza el régimen de Propiedad Horizontal. Cambios importantes: la mayoría para decisiones bajó de 66% a 51%, se obliga al Fondo de Imprevistos del 1%, y la inasistencia a asambleas tiene multa del 20% de la cuota mensual.",
    tables: [
      {
        title: "Cambios clave Ley 284/2022",
        cols: ["Concepto", "Antes", "Ahora"],
        rows: [
          ["Mayoría decisiones", "66%", "51%"],
          ["Fondo Imprevistos", "Voluntario", "Obligatorio 1%"],
          ["Multa inasistencia asamblea", "Variable", "20% de cuota"],
          ["Asambleas virtuales", "No reguladas", "Permitidas"],
        ],
      },
      {
        title: "Tipos de mayoría",
        cols: ["Tipo de decisión", "Mayoría requerida"],
        rows: [
          ["Decisiones ordinarias", "51%"],
          ["Reforma reglamento copropiedad", "75%"],
          ["Cambio de uso del PH", "100% (unanimidad)"],
          ["Disolución", "75% más autorización judicial"],
          ["Obras nuevas no esenciales", "75%"],
        ],
      },
      {
        title: "Fondo de Imprevistos",
        cols: ["Concepto", "Detalle"],
        rows: [
          ["Tasa obligatoria", "1% sobre las cuotas ordinarias"],
          ["Naturaleza", "Reserva para gastos no previstos"],
          ["Disposición", "Aprobación de asamblea"],
          ["Acumulación", "Hasta cierto tope, luego se reduce o suspende"],
        ],
      },
      {
        title: "Asambleas",
        cols: ["Concepto", "Detalle"],
        rows: [
          ["Ordinaria", "Anual mínimo"],
          ["Extraordinaria", "Cuando se requiera"],
          ["Convocatoria mínima", "10 días de anticipación"],
          ["Modalidad", "Presencial o virtual"],
          ["Multa por inasistencia", "20% de la cuota mensual"],
          ["Quórum", "Según reglamento más ley"],
        ],
      },
    ],
  },
  ph_construccion: {
    block: 8,
    title: "Constitución del PH",
    subtitle: "Bloque 8 · 3 fases del PH",
    desc: "La constitución de un PH atraviesa tres fases obligatorias en orden: MIVIOT (aprobación del régimen), Notario (escritura pública), Registro Público (inscripción). Sin completar las tres fases, el PH no existe legalmente.",
    tables: [
      {
        title: "Las 3 fases del PH",
        cols: ["Fase", "Autoridad", "Acto"],
        rows: [
          ["1", "MIVIOT", "Aprobación del régimen y reglamento de copropiedad"],
          ["2", "Notario", "Escritura pública de incorporación al régimen"],
          ["3", "Registro Público", "Inscripción que da efecto frente a terceros"],
        ],
      },
      {
        title: "Documentos requeridos",
        cols: ["#", "Documento"],
        rows: [
          ["1", "Plano del PH aprobado por MIVIOT"],
          ["2", "Memoria descriptiva del proyecto"],
          ["3", "Reglamento de copropiedad"],
          ["4", "Coeficientes de cada unidad (área / valor)"],
          ["5", "Áreas comunes identificadas"],
          ["6", "Áreas privativas identificadas"],
          ["7", "Permiso de ocupación"],
        ],
      },
      {
        title: "Áreas en el PH",
        cols: ["Tipo", "Naturaleza", "Ejemplos"],
        rows: [
          ["Privativas", "Propiedad exclusiva del titular", "Apartamento, depósito, estacionamiento numerado"],
          ["Comunes", "Propiedad de todos en proporción", "Pasillos, escaleras, ascensores, fachadas"],
          ["Comunes de uso exclusivo", "Comunes pero asignadas", "Terraza adjunta a un apto, estacionamiento asignado"],
          ["Servicios", "Equipamiento y mantenimiento", "Cuartos eléctricos, cisternas, generadores"],
        ],
      },
    ],
  },
  tur_incentivos: {
    block: 8,
    title: "Turismo — Ley 80/2012",
    subtitle: "Bloque 8 · Incentivos al sector turismo",
    desc: "La Ley 80 de 2012 establece incentivos para inversión turística. Los montos mínimos varían según ubicación: B/.250,000 fuera del distrito de Panamá, B/.100,000 en zonas indígenas, B/.8 millones en distrito de Panamá y B/.30 millones para centros de convenciones. Incluye fianza del 2% de la inversión hasta B/.1 millón.",
    tables: [
      {
        title: "Montos mínimos de inversión",
        cols: ["Ubicación / Tipo", "Inversión mínima"],
        rows: [
          ["Fuera del distrito de Panamá", "B/.250,000"],
          ["Zonas indígenas / comarcas", "B/.100,000"],
          ["Distrito de Panamá", "B/.8,000,000"],
          ["Centros de convenciones", "B/.30,000,000"],
        ],
      },
      {
        title: "Fianza turística",
        cols: ["Concepto", "Valor"],
        rows: [
          ["Tasa", "2% de la inversión"],
          ["Tope máximo", "B/.1,000,000"],
          ["Beneficiario", "Estado / ATP"],
          ["Propósito", "Garantizar cumplimiento del plan"],
        ],
      },
      {
        title: "Incentivos fiscales",
        cols: ["Tributo", "Beneficio", "Plazo"],
        rows: [
          ["ISR sobre actividad turística", "Exoneración total", "15 años"],
          ["Impuesto inmuebles", "Exoneración total", "15 años"],
          ["Aranceles importación", "Exonerados", "Por equipos turísticos"],
          ["ITBMS sobre construcciones", "Exonerado", "Por proyecto autorizado"],
        ],
      },
      {
        title: "Actividades cubiertas",
        cols: ["#", "Actividad"],
        rows: [
          ["1", "Hospedaje turístico (hoteles, apart-hoteles)"],
          ["2", "Centros de convenciones"],
          ["3", "Marinas y deportes acuáticos"],
          ["4", "Centros de turismo rural y ecológico"],
          ["5", "Restaurantes asociados a hospedaje turístico"],
        ],
      },
    ],
  },
  // BLOQUE 9
  cont_compraventa: {
    block: 9,
    title: "Compraventa de inmuebles",
    subtitle: "Bloque 9 · Código Civil + Registro Público",
    desc: "La compraventa de inmuebles requiere Escritura Pública (Art. 1220 CC) y debe inscribirse en el Registro Público (Art. 1232 CC) para tener efecto frente a terceros. La transferencia real ocurre con la inscripción, no con la firma de la EP. Antes hay típicamente promesa de compraventa con arras.",
    tables: [
      {
        title: "Etapas de la compraventa",
        cols: ["Etapa", "Documento", "Norma"],
        rows: [
          ["1. Tratativas", "Conversaciones / oferta", "Libertad contractual"],
          ["2. Promesa", "Promesa de Compraventa", "Art. 1221 CC + jurisprudencia"],
          ["3. Arras / señal", "Recibo de arras", "Práctica notarial"],
          ["4. Escritura Pública", "EP de compraventa", "Art. 1220 CC"],
          ["5. Pago tributos", "ITBI más GC", "Ley 106/74 + Ley 6/2005"],
          ["6. Inscripción", "Anotación en Registro Público", "Art. 1232 CC"],
        ],
      },
      {
        title: "Requisitos esenciales",
        cols: ["Elemento", "Detalle"],
        rows: [
          ["Consentimiento", "Voluntad libre y manifiesta de ambas partes"],
          ["Objeto cierto", "Inmueble identificado con finca, tomo, folio"],
          ["Precio", "Determinado o determinable"],
          ["Capacidad", "Mayor de edad, sin interdicción"],
          ["Forma", "Escritura Pública"],
          ["Inscripción", "Registro Público"],
        ],
      },
      {
        title: "Promesa de compraventa",
        cols: ["Concepto", "Detalle"],
        rows: [
          ["Naturaleza", "Contrato preparatorio de la compraventa"],
          ["Forma típica", "Documento privado o EP"],
          ["Plazo", "El que pacten las partes"],
          ["Arras / señal", "Suma de dinero como garantía"],
          ["Si compradora se arrepiente", "Pierde las arras"],
          ["Si vendedora se arrepiente", "Devuelve arras dobladas (típico)"],
        ],
      },
    ],
  },
  cont_otros: {
    block: 9,
    title: "Contratos accesorios",
    subtitle: "Bloque 9 · Hipoteca, anticresis, fideicomiso",
    desc: "Junto a la compraventa coexisten varios contratos accesorios o complementarios: hipoteca (garantía real sobre inmueble), anticresis (frutos en garantía), fideicomiso (administración fiduciaria), permuta (intercambio), donación (gratuito), entre otros.",
    tables: [
      {
        title: "Contratos sobre inmuebles",
        cols: ["Contrato", "Naturaleza"],
        rows: [
          ["Compraventa", "Transfiere dominio a cambio de precio"],
          ["Permuta", "Intercambio de dos bienes"],
          ["Donación", "Transferencia gratuita"],
          ["Hipoteca", "Garantía real, sin transferencia"],
          ["Anticresis", "Acreedor recibe frutos / rentas"],
          ["Fideicomiso", "Bien transferido a fiduciario para administrar"],
          ["Promesa", "Compromiso de celebrar contrato definitivo"],
          ["Opción", "Derecho a comprar dentro de plazo"],
        ],
      },
      {
        title: "Hipoteca",
        cols: ["Concepto", "Detalle"],
        rows: [
          ["Naturaleza", "Garantía real sobre inmueble"],
          ["Forma", "Escritura Pública más Registro Público"],
          ["Permanece propietario", "El deudor — no transfiere dominio"],
          ["Acción", "Acreedor puede ejecutar en mora"],
          ["Prelación", "Por orden de inscripción"],
          ["Liberación", "Pago más cancelación registral"],
        ],
      },
      {
        title: "Usucapión — adquisición por posesión",
        cols: ["Tipo", "Plazo", "Requisitos"],
        rows: [
          ["Ordinaria", "15 años", "Posesión + justo título + buena fe"],
          ["Extraordinaria", "20 años", "Posesión continua, pacífica, pública"],
          ["Bienes públicos", "No procede", "Imprescriptibles"],
          ["Procede ante", "Tribunal civil", ""],
        ],
      },
    ],
  },
  cont_documentos: {
    block: 9,
    title: "Documentos y registro",
    subtitle: "Bloque 9 · Registro Público y notaría",
    desc: "El Registro Público de Panamá da publicidad y oponibilidad a los actos sobre inmuebles. La inscripción es constitutiva en muchos casos. Los notarios autorizan las EP. La Dirección General de Registro Público (DGRP) es la autoridad. Para acreditar propiedad se obtiene certificado de finca.",
    tables: [
      {
        title: "Registro Público",
        cols: ["Concepto", "Detalle"],
        rows: [
          ["Autoridad", "Dirección General de Registro Público (DGRP)"],
          ["Sistema de identificación", "Folio Real (finca, tomo, folio / RUC)"],
          ["Principios", "Publicidad, especialidad, prioridad, legalidad, fe pública"],
          ["Efecto inscripción", "Oponibilidad ante terceros"],
          ["Documentos básicos", "Certificado de finca, marginales, gravámenes"],
        ],
      },
      {
        title: "Notarios",
        cols: ["Concepto", "Detalle"],
        rows: [
          ["Función", "Autorizar EP — fe pública"],
          ["Designación", "Por el Órgano Ejecutivo, a vida"],
          ["Distribución", "Notarías por circuito"],
          ["EP de inmuebles", "Obligatoria para validez"],
          ["Costos", "Tarifa fijada en arancel"],
        ],
      },
      {
        title: "Documentos típicos en operación",
        cols: ["#", "Documento"],
        rows: [
          ["1", "Cédulas y poderes vigentes"],
          ["2", "Certificado de finca actualizado"],
          ["3", "Paz y salvo del impuesto de inmuebles"],
          ["4", "Paz y salvo de IDAAN, agua o EP"],
          ["5", "Paz y salvo de PH (si aplica)"],
          ["6", "Avalúo si requerido"],
          ["7", "Comprobantes ITBI y GC pagados"],
          ["8", "Permiso de ocupación si construcción nueva"],
        ],
      },
    ],
  },
  // BLOQUE 10
  calc_formulas: {
    block: 10,
    title: "Fórmulas tributarias",
    subtitle: "Bloque 10 · Resumen de cálculos",
    desc: "Resumen de las fórmulas que más se preguntan en el examen. Memoriza el orden: catastral actualizado primero, luego ITBI sobre el mayor, luego Ganancia de Capital eligiendo entre 10% y 3%. Para PFT, los tramos son 0% / 0.5% / 0.7%. Las calculadoras de la app aplican estas fórmulas paso a paso.",
    tables: [
      {
        title: "Fórmulas clave",
        cols: ["Cálculo", "Fórmula"],
        rows: [
          ["Catastral actualizado", "Precio compra por (1 + (años x 5%)), donde años = año venta - año compra - 1"],
          ["ITBI", "MAX(precio venta, catastral actualizado) x 2%"],
          ["GC opción A", "(Precio venta - precio compra) x 10%"],
          ["GC opción B", "Precio venta x 3%"],
          ["GC a pagar", "MIN(opción A, opción B)"],
          ["PFT exento", "Si valor catastral ≤ B/.120,000 → 0%"],
          ["PFT tramo medio", "(VC - 120,000) x 0.5% si VC ≤ 700,000"],
          ["PFT tramo alto", "580,000 x 0.5% + (VC - 700,000) x 0.7%"],
          ["Comisión CBR", "Precio venta x % pactado"],
          ["Neto vendedor", "Precio venta - ITBI - GC - comisión - cancelación hipoteca"],
        ],
      },
      {
        title: "Tramos rápidos PFT/VP",
        cols: ["Valor catastral", "Tarifa", "Cálculo"],
        rows: [
          ["Hasta B/.120,000", "0%", "Exento"],
          ["120,001 a 700,000", "0.5%", "Sobre exceso de 120,000"],
          ["Más de 700,000", "0.7%", "Sobre exceso de 700,000"],
        ],
      },
      {
        title: "Tramos Otros Inmuebles",
        cols: ["Valor catastral", "Tarifa"],
        rows: [
          ["Hasta B/.30,000", "0% — exento"],
          ["30,001 a 250,000", "0.6%"],
          ["250,001 a 500,000", "0.8%"],
          ["Más de 500,000", "1.0%"],
        ],
      },
    ],
  },
};

function calcCatastralActualizado(precioCompra, anioCompra, anioVenta) {
  const anios = Math.max(0, anioVenta - anioCompra - 1);
  const incremento = anios * 0.05;
  return { anios, incremento: incremento * 100, valor: precioCompra * (1 + incremento) };
}
function calcITBI(precioVenta, catastralActualizado) {
  const base = Math.max(precioVenta, catastralActualizado);
  return { base, fuente: precioVenta >= catastralActualizado ? "precio de venta" : "catastral actualizado", impuesto: base * 0.02 };
}
function calcGananciaCapital(precioCompra, precioVenta) {
  const ganancia = precioVenta - precioCompra;
  const opcion10 = Math.max(0, ganancia) * 0.10;
  const opcion3 = precioVenta * 0.03;
  return { ganancia, opcion10, opcion3, conviene: opcion10 < opcion3 ? "10% sobre ganancia" : "3% del precio de venta", montoConviene: Math.min(opcion10, opcion3), ahorro: Math.abs(opcion10 - opcion3) };
}
function calcImpInmueblesPFT(valorCatastral) {
  let impuesto = 0; let detalle = [];
  if (valorCatastral <= 120000) { detalle.push({ tramo: "Exento (hasta B/.120,000)", monto: 0 }); }
  else if (valorCatastral <= 700000) {
    const base = valorCatastral - 120000; impuesto = base * 0.005;
    detalle.push({ tramo: "Exento (primeros B/.120,000)", monto: 0 });
    detalle.push({ tramo: `0.5% sobre B/.${base.toLocaleString()}`, monto: impuesto });
  } else {
    const tramoMedio = 580000; const tramoAlto = valorCatastral - 700000;
    const impMedio = tramoMedio * 0.005; const impAlto = tramoAlto * 0.007;
    impuesto = impMedio + impAlto;
    detalle.push({ tramo: "Exento (primeros B/.120,000)", monto: 0 });
    detalle.push({ tramo: `0.5% sobre B/.${tramoMedio.toLocaleString()}`, monto: impMedio });
    detalle.push({ tramo: `0.7% sobre B/.${tramoAlto.toLocaleString()}`, monto: impAlto });
  }
  return { impuesto, detalle };
}
function fmtCurrency(n) { return `B/.${Number(n).toLocaleString('es-PA', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`; }

function useGoogleFonts() {
  useEffect(() => {
    // preconnect para acelerar carga
    const pre1 = document.createElement('link');
    pre1.rel = 'preconnect'; pre1.href = 'https://fonts.googleapis.com';
    document.head.appendChild(pre1);
    const pre2 = document.createElement('link');
    pre2.rel = 'preconnect'; pre2.href = 'https://fonts.gstatic.com'; pre2.crossOrigin = 'anonymous';
    document.head.appendChild(pre2);
    // fuente
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Manrope:wght@200;300;400;500;600;700;800&display=swap';
    document.head.appendChild(link);
    // forzar fuente y desactivar síntesis para que se vea igual en cualquier dispositivo
    const prevBodyFont = document.body.style.fontFamily;
    const prevBodySyn = document.body.style.fontSynthesis;
    document.body.style.fontFamily = "'Manrope', 'Avenir Next', 'Avenir', 'Helvetica Neue', system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
    document.body.style.fontSynthesis = 'none';
    return () => {
      try { document.head.removeChild(link); } catch(e) {}
      try { document.head.removeChild(pre1); } catch(e) {}
      try { document.head.removeChild(pre2); } catch(e) {}
      document.body.style.fontFamily = prevBodyFont;
      document.body.style.fontSynthesis = prevBodySyn;
    };
  }, []);
}

const STYLES = {
  serif: "'Manrope', 'Avenir Next', 'Avenir', 'Helvetica Neue', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  sans: "'Manrope', 'Avenir Next', 'Avenir', 'Helvetica Neue', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
};

// ─── Ícono de marca MEJORÍA — PNG real, colorizado con CSS filter ───
// variant="gold"    → dorado #c9a961  (cajas navy / fondos oscuros)
// variant="default" → navy  #1a3a5c  (fondos claros / footer)
function MejoriaIcon({ size = 24, variant = 'default', className = '' }) {
  const filter = variant === 'gold'
    ? 'brightness(0) saturate(100%) invert(74%) sepia(28%) saturate(612%) hue-rotate(4deg) brightness(101%) contrast(94%)'
    : 'brightness(0) saturate(100%) invert(18%) sepia(42%) saturate(868%) hue-rotate(186deg) brightness(95%) contrast(97%)';
  return (
    <img
      src="/logo-mejoria.png"
      width={size}
      height={size}
      alt=""
      draggable={false}
      style={{ filter, objectFit: 'contain', display: 'block', userSelect: 'none' }}
      className={className}
    />
  );
}

// Saludo dinámico por hora del día
function getGreeting() {
  const h = new Date().getHours();
  if (h < 6) return { text: "Buenas noches", icon: Moon };
  if (h < 12) return { text: "Buenos días", icon: Sunrise };
  if (h < 19) return { text: "Buenas tardes", icon: Sun };
  return { text: "Buenas noches", icon: Moon };
}

// Animaciones globales
function GlobalStyles() {
  return (
    <style>{`
      @keyframes cbrFadeUp {
        from { opacity: 0; transform: translateY(12px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes cbrPulseGlow {
        0%, 100% { box-shadow: 0 0 0 0 rgba(201, 169, 97, 0.5); }
        50% { box-shadow: 0 0 0 12px rgba(201, 169, 97, 0); }
      }
      @keyframes cbrSplashFade {
        0% { opacity: 0; transform: scale(0.92); }
        50% { opacity: 1; transform: scale(1.02); }
        100% { opacity: 1; transform: scale(1); }
      }
      @keyframes cbrShine {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(200%); }
      }
      .cbr-fade-up { animation: cbrFadeUp 0.5s ease-out forwards; }
      .cbr-pulse-glow { animation: cbrPulseGlow 2.4s ease-out infinite; }
      .cbr-splash { animation: cbrSplashFade 0.7s ease-out forwards; }
      .cbr-stagger-1 { animation-delay: 0.05s; opacity: 0; }
      .cbr-stagger-2 { animation-delay: 0.12s; opacity: 0; }
      .cbr-stagger-3 { animation-delay: 0.2s; opacity: 0; }
      .cbr-stagger-4 { animation-delay: 0.28s; opacity: 0; }
      .cbr-no-scrollbar::-webkit-scrollbar { display: none; }
      .cbr-no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

      /* — Transición de vista tipo push iOS — */
      @keyframes cbrViewEnter {
        from { opacity: 0; transform: translateX(18px); }
        to   { opacity: 1; transform: translateX(0); }
      }
      .cbr-view-enter {
        animation: cbrViewEnter 0.22s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
        will-change: transform, opacity;
      }

      /* — Spring press en botones táctiles — */
      button { -webkit-tap-highlight-color: rgba(0,0,0,0); }
      button:active { transition: transform 0.08s cubic-bezier(0.34, 1.56, 0.64, 1) !important; }

      /* — Tab bar icon spring — */
      .cbr-tab-icon {
        transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      button:active .cbr-tab-icon { transform: scale(0.82) !important; }
    `}</style>
  );
}

// ============================================================
// APP PRINCIPAL
// ============================================================
export default function App() {
  useGoogleFonts();
  const [view, setView] = useState('home');
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [progress, setProgress] = useState({});
  const [errors, setErrors] = useState([]);
  const [examHistory, setExamHistory] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      try { const p = await window.storage.get('cbr2-progress'); if (p) setProgress(JSON.parse(p.value)); } catch (e) {}
      try { const e = await window.storage.get('cbr2-errors'); if (e) setErrors(JSON.parse(e.value)); } catch (e) {}
      try { const h = await window.storage.get('cbr2-history'); if (h) setExamHistory(JSON.parse(h.value)); } catch (e) {}
      setLoaded(true);
    }
    load();
  }, []);

  // scroll al top al cambiar de vista
  useEffect(() => {
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [view, selectedBlock]);

  const saveHistory = useCallback(async (nh) => {
    setExamHistory(nh);
    try { await window.storage.set('cbr2-history', JSON.stringify(nh)); } catch (e) {}
  }, []);

  const recordAnswer = useCallback((qId, isCorrect) => {
    setProgress(prev => {
      const np = { ...prev };
      if (!np[qId]) np[qId] = { correct: 0, incorrect: 0, last: 0 };
      if (isCorrect) np[qId].correct++; else np[qId].incorrect++;
      np[qId].last = Date.now();
      try { window.storage.set('cbr2-progress', JSON.stringify(np)); } catch (e) {}
      return np;
    });
    if (!isCorrect) {
      setErrors(prev => {
        const exists = prev.find(e => e.qId === qId);
        let ne;
        if (exists) ne = prev.map(e => e.qId === qId ? { ...e, times: e.times + 1, date: Date.now() } : e);
        else ne = [...prev, { qId, date: Date.now(), times: 1 }];
        try { window.storage.set('cbr2-errors', JSON.stringify(ne)); } catch (e) {}
        return ne;
      });
    }
  }, []);

  const removeFromErrors = useCallback((qId) => {
    setErrors(prev => {
      const ne = prev.filter(e => e.qId !== qId);
      try { window.storage.set('cbr2-errors', JSON.stringify(ne)); } catch (e) {}
      return ne;
    });
  }, []);

  const resetAll = useCallback(async () => {
    setProgress({}); setErrors([]); setExamHistory([]);
    try { await window.storage.delete('cbr2-progress'); } catch (e) {}
    try { await window.storage.delete('cbr2-errors'); } catch (e) {}
    try { await window.storage.delete('cbr2-history'); } catch (e) {}
  }, []);

  const stats = useMemo(() => {
    const total = QUESTIONS.length;
    const answered = Object.keys(progress).length;
    const correct = Object.values(progress).reduce((s, p) => s + (p.correct > p.incorrect ? 1 : 0), 0);
    const byBlock = BLOCKS.map(b => {
      const qs = QUESTIONS.filter(q => q.block === b.id);
      const ans = qs.filter(q => progress[q.id]).length;
      const cor = qs.filter(q => { const p = progress[q.id]; return p && p.correct > p.incorrect; }).length;
      return { ...b, total: qs.length, answered: ans, correct: cor, pct: qs.length ? Math.round((cor / qs.length) * 100) : 0 };
    });
    return { total, answered, correct, byBlock, errorsCount: errors.length };
  }, [progress, errors]);

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: COLORS.bg, fontFamily: STYLES.sans }}>
        <GlobalStyles />
        <div className="text-center cbr-splash">
          <div className="flex items-center justify-center w-20 h-20 mx-auto mb-5 rounded-2xl cbr-pulse-glow" style={{ backgroundColor: COLORS.primary }}>
            <span style={{ color: COLORS.accent, fontFamily: STYLES.serif, fontWeight: 800, fontSize: '1.75rem', letterSpacing: '-0.03em' }}>CBR</span>
          </div>
          <div className="text-4xl mb-2" style={{ color: COLORS.primary, fontFamily: STYLES.serif, fontWeight: 800, letterSpacing: '-0.03em' }}>CBR <span style={{ color: COLORS.accent }}>2.0</span></div>
          <div className="text-[11px] tracking-[0.3em] uppercase mb-1" style={{ color: COLORS.textMuted, fontWeight: 700 }}>Tu prep para el examen JTBR</div>
          <div className="text-[10px] mt-3 tracking-wider" style={{ color: COLORS.textLight, fontWeight: 500 }}>Cargando…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.bg, color: COLORS.text, fontFamily: STYLES.sans }}>
      <GlobalStyles />
      <Header view={view} setView={setView} />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-10 cbr-pb-nav md:pb-10">
        <div key={`${view}-${selectedBlock}`} className="cbr-view-enter">
          {view === 'home' && <HomeView setView={setView} setSelectedBlock={setSelectedBlock} stats={stats} />}
          {view === 'blocks' && <BlocksView setView={setView} setSelectedBlock={setSelectedBlock} stats={stats} />}
          {view === 'study' && selectedBlock && <StudyView block={selectedBlock} setView={setView} progress={progress} recordAnswer={recordAnswer} />}
          {view === 'flashcards' && <FlashcardsView setView={setView} />}
          {view === 'quiz' && <QuizView setView={setView} recordAnswer={recordAnswer} />}
          {view === 'exam' && <ExamView setView={setView} examHistory={examHistory} saveHistory={saveHistory} recordAnswer={recordAnswer} />}
          {view === 'errors' && <ErrorsView setView={setView} errors={errors} recordAnswer={recordAnswer} removeFromErrors={removeFromErrors} />}
          {view === 'resources' && <ResourcesView setView={setView} />}
          {view === 'calculator' && <CalculatorView setView={setView} />}
          {view === 'stats' && <StatsView stats={stats} examHistory={examHistory} resetAll={resetAll} />}
        </div>
      </main>
      <Footer />
      <BottomTabBar view={view} setView={setView} />
    </div>
  );
}

// ============================================================
// HEADER (compacto en móvil — sin nav)
// ============================================================
function Header({ view, setView }) {
  const navItems = [
    { id: 'home', label: 'Inicio', icon: Home },
    { id: 'resources', label: 'Recursos', icon: Library },
    { id: 'calculator', label: 'Calculadora', icon: Calculator },
    { id: 'errors', label: 'Errores', icon: AlertCircle },
    { id: 'stats', label: 'Progreso', icon: BarChart3 },
  ];
  return (
    <header className="sticky top-0 z-40 cbr-header-safe" style={{ backgroundColor: COLORS.bgCard, borderBottom: `1px solid ${COLORS.border}` }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between py-3.5 sm:py-4">
          <button onClick={() => setView('home')} className="flex items-center gap-3 group">
            <div className="flex items-center justify-center w-11 h-11 rounded-xl transition-transform group-hover:scale-105" style={{ backgroundColor: COLORS.primary, boxShadow: `0 2px 10px ${COLORS.primary}44` }}>
              <span style={{ color: COLORS.accent, fontFamily: STYLES.serif, fontWeight: 800, fontSize: '0.95rem', letterSpacing: '-0.02em' }}>CBR</span>
            </div>
            <div className="text-left">
              <div className="text-lg sm:text-xl leading-tight" style={{ color: COLORS.primary, fontFamily: STYLES.serif, fontWeight: 800, letterSpacing: '-0.02em' }}>CBR <span style={{ color: COLORS.accent }}>2.0</span></div>
              <div className="text-[9px] sm:text-[10px] tracking-[0.18em] uppercase" style={{ color: COLORS.textMuted, fontWeight: 600 }}>Prep examen JTBR</div>
            </div>
          </button>
          <div className="hidden md:flex items-center gap-2 text-xs tracking-wider uppercase" style={{ color: COLORS.textMuted, fontWeight: 500 }}>
            <FileBadge2 size={14} style={{ color: COLORS.accent }} />
            <span>Corredor de Bienes Raíces</span>
          </div>
        </div>
        {/* Desktop nav — oculto en mobile */}
        <nav className="hidden md:flex items-center -mb-px" style={{ borderTop: `1px solid ${COLORS.border}` }}>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = view === item.id;
            return (
              <button key={item.id} onClick={() => setView(item.id)}
                className="flex items-center gap-2 px-4 py-3 text-xs uppercase tracking-wider whitespace-nowrap transition-all border-b-2"
                style={{
                  color: isActive ? COLORS.primary : COLORS.textMuted,
                  borderColor: isActive ? COLORS.accent : 'transparent',
                  fontWeight: isActive ? 600 : 500,
                }}>
                <Icon size={15} strokeWidth={isActive ? 2.5 : 2} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

// ============================================================
// BOTTOM TAB BAR (estilo app de banco)
// ============================================================
function BottomTabBar({ view, setView }) {
  const items = [
    { id: 'home', label: 'Inicio', icon: Home },
    { id: 'resources', label: 'Recursos', icon: Library },
    { id: 'calculator', label: 'Cálculo', icon: Calculator },
    { id: 'errors', label: 'Errores', icon: AlertCircle },
    { id: 'stats', label: 'Progreso', icon: BarChart3 },
  ];
  // mostrar como activo si view es home/blocks/study, etc.
  const activeMap = {
    home: 'home', blocks: 'home', study: 'home', quiz: 'home', flashcards: 'home', exam: 'home',
    resources: 'resources', calculator: 'calculator', errors: 'errors', stats: 'stats',
  };
  const active = activeMap[view] || 'home';

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50" style={{ backgroundColor: COLORS.bgCard, borderTop: `1px solid ${COLORS.border}`, paddingBottom: 'env(safe-area-inset-bottom)', boxShadow: `0 -2px 12px ${COLORS.primary}10` }}>
      <div className="grid grid-cols-5">
        {items.map(item => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button key={item.id} onClick={() => setView(item.id)}
              className="flex flex-col items-center justify-center py-2.5 gap-0.5 transition-all relative active:scale-95"
              style={{ color: isActive ? COLORS.primary : COLORS.textLight }}>
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-b" style={{ backgroundColor: COLORS.accent }} />
              )}
              <div className="flex items-center justify-center w-9 h-9 rounded-xl transition-all cbr-tab-icon" style={{ backgroundColor: isActive ? COLORS.bgSoft : 'transparent' }}>
                <Icon size={20} strokeWidth={isActive ? 2.4 : 1.8} style={{ color: isActive ? COLORS.primary : COLORS.textLight }} />
              </div>
              <span className="text-[9px] uppercase tracking-wider" style={{ fontWeight: isActive ? 700 : 500, color: isActive ? COLORS.primary : COLORS.textLight }}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ============================================================
// FOOTER (by MEJORÍA)
// ============================================================
function Footer() {
  return (
    <footer className="mt-20" style={{ borderTop: `1px solid ${COLORS.border}`, backgroundColor: COLORS.bgCard }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="flex flex-col sm:flex-row justify-between gap-6 sm:items-end">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl" style={{ backgroundColor: COLORS.primary }}>
              <span style={{ color: COLORS.accent, fontFamily: STYLES.serif, fontWeight: 800, fontSize: '0.85rem', letterSpacing: '-0.02em' }}>CBR</span>
            </div>
            <div>
              <div className="text-xl leading-tight" style={{ color: COLORS.primary, fontFamily: STYLES.serif, fontWeight: 800, letterSpacing: '-0.02em' }}>CBR <span style={{ color: COLORS.accent }}>2.0</span></div>
              <div className="text-xs mt-1" style={{ color: COLORS.textMuted }}>Plataforma para preparar el examen de la JTBR</div>
            </div>
          </div>
          <div className="text-xs leading-relaxed sm:text-right" style={{ color: COLORS.textMuted }}>
            <div className="flex items-center sm:justify-end gap-2 mb-1">
              <span>by <strong style={{ color: COLORS.primary, fontFamily: STYLES.serif, fontWeight: 700, fontSize: '13px', letterSpacing: '0.04em' }}>MEJORÍA</strong></span>
            </div>
            <div>Material no oficial. Referencia académica.</div>
            <div className="mt-1 italic" style={{ color: COLORS.textLight }}>Sin afiliación con el MICI ni con la JTBR.</div>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ============================================================
// COMPONENTES BASE
// ============================================================
function PrimaryButton({ children, onClick, icon: Icon, iconPos = 'right', disabled, fullWidth, size = 'md', pulse }) {
  const padding = size === 'lg' ? 'px-6 py-4' : size === 'sm' ? 'px-3 py-2' : 'px-5 py-3';
  return (
    <button onClick={onClick} disabled={disabled}
      className={`${padding} ${fullWidth ? 'w-full' : ''} ${pulse ? 'cbr-pulse-glow' : ''} text-xs uppercase tracking-wider font-semibold rounded-lg transition-all hover:opacity-90 active:scale-95 disabled:opacity-30 disabled:active:scale-100 inline-flex items-center justify-center gap-2 group`}
      style={{ backgroundColor: COLORS.primary, color: COLORS.accent, boxShadow: `0 1px 3px ${COLORS.primary}30` }}>
      {Icon && iconPos === 'left' && <Icon size={14} strokeWidth={2.5} className="transition-transform group-hover:-translate-x-0.5" />}
      {children}
      {Icon && iconPos === 'right' && <Icon size={14} strokeWidth={2.5} className="transition-transform group-hover:translate-x-0.5" />}
    </button>
  );
}

function SecondaryButton({ children, onClick, icon: Icon, iconPos = 'left', disabled, fullWidth, size = 'md', danger }) {
  const padding = size === 'lg' ? 'px-6 py-4' : size === 'sm' ? 'px-3 py-2' : 'px-5 py-3';
  const color = danger ? COLORS.error : COLORS.primary;
  const border = danger ? COLORS.error : COLORS.border;
  return (
    <button onClick={onClick} disabled={disabled}
      className={`${padding} ${fullWidth ? 'w-full' : ''} text-xs uppercase tracking-wider font-semibold rounded-lg transition-all hover:opacity-90 active:scale-95 disabled:opacity-30 disabled:active:scale-100 inline-flex items-center justify-center gap-2`}
      style={{ color, border: `1px solid ${border}`, backgroundColor: COLORS.bgCard }}>
      {Icon && iconPos === 'left' && <Icon size={14} strokeWidth={2.5} />}
      {children}
      {Icon && iconPos === 'right' && <Icon size={14} strokeWidth={2.5} />}
    </button>
  );
}

function SuccessButton({ children, onClick, icon: Icon, iconPos = 'left' }) {
  return (
    <button onClick={onClick}
      className="px-5 py-3 text-xs uppercase tracking-wider font-semibold rounded-lg transition-all hover:opacity-90 active:scale-95 inline-flex items-center justify-center gap-2"
      style={{ backgroundColor: COLORS.success, color: COLORS.bgCard, boxShadow: `0 1px 3px ${COLORS.success}30` }}>
      {Icon && iconPos === 'left' && <Icon size={14} strokeWidth={2.5} />}
      {children}
      {Icon && iconPos === 'right' && <Icon size={14} strokeWidth={2.5} />}
    </button>
  );
}

function StatCell({ label, value, accent, icon: Icon }) {
  return (
    <div className="p-4 sm:p-5" style={{ backgroundColor: COLORS.bgCard }}>
      <div className="flex items-center gap-1.5 mb-2">
        {Icon && <Icon size={11} style={{ color: accent ? COLORS.accent : COLORS.textMuted }} />}
        <div className="text-[9px] sm:text-[10px] uppercase tracking-[0.15em]" style={{ color: COLORS.textMuted, fontWeight: 600 }}>{label}</div>
      </div>
      <div className="text-2xl sm:text-3xl" style={{ color: accent ? COLORS.accent : COLORS.primary, fontFamily: STYLES.serif, fontWeight: 600 }}>{value}</div>
    </div>
  );
}

function SectionHeader({ pre, title, icon: Icon }) {
  return (
    <div className="mb-5 sm:mb-6">
      <div className="flex items-center gap-2 mb-2">
        {Icon && <Icon size={12} style={{ color: COLORS.accent }} />}
        <div className="text-[10px] tracking-[0.3em] uppercase" style={{ color: COLORS.accent, fontWeight: 600 }}>{pre}</div>
      </div>
      <h2 className="text-2xl sm:text-3xl md:text-4xl tracking-tight leading-[1.05]" style={{ color: COLORS.primary, fontFamily: STYLES.serif, fontWeight: 800, letterSpacing: '-0.02em' }}>{title}</h2>
    </div>
  );
}

function ModeCard({ num, title, desc, action, onClick, highlight, icon: Icon, pulse }) {
  return (
    <button onClick={onClick} className={`text-left p-5 sm:p-7 transition-all hover:opacity-95 active:scale-[0.98] group relative overflow-hidden ${pulse ? 'cbr-pulse-glow' : ''}`}
      style={{ backgroundColor: highlight ? COLORS.primary : COLORS.bgCard }}>
      <div className="flex items-start justify-between mb-4 sm:mb-5">
        <div className="text-[10px] tracking-[0.3em] uppercase" style={{ color: highlight ? COLORS.accent : COLORS.textLight, fontWeight: 600 }}>{num}</div>
        <div className="flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-xl transition-transform group-hover:scale-110" style={{ backgroundColor: highlight ? `${COLORS.accent}22` : COLORS.bgSoft, border: `1px solid ${highlight ? COLORS.accent + '44' : COLORS.border}` }}>
          {Icon && <Icon size={20} strokeWidth={1.8} style={{ color: highlight ? COLORS.accent : COLORS.primary }} />}
        </div>
      </div>
      <div className="text-xl sm:text-2xl md:text-3xl mb-2 sm:mb-3 leading-tight" style={{ color: highlight ? COLORS.bgCard : COLORS.primary, fontFamily: STYLES.serif, fontWeight: 600 }}>{title}</div>
      <p className="text-sm leading-relaxed mb-5 sm:mb-6" style={{ color: highlight ? '#d8d8d8' : COLORS.textMuted }}>{desc}</p>
      <div className="flex items-center gap-2 text-xs tracking-wider uppercase font-semibold" style={{ color: highlight ? COLORS.accent : COLORS.primary }}>
        <span>{action}</span>
        <ChevronRight size={14} strokeWidth={2.5} className="transition-transform group-hover:translate-x-1" />
      </div>
    </button>
  );
}

function ToolCard({ title, desc, badge, onClick, icon: Icon }) {
  return (
    <button onClick={onClick} className="text-left p-5 transition-all hover:opacity-95 active:scale-[0.98] group" style={{ backgroundColor: COLORS.bgCard }}>
      <div className="flex items-start justify-between mb-3 gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl transition-transform group-hover:scale-110" style={{ backgroundColor: COLORS.bgSoft, border: `1px solid ${COLORS.border}` }}>
          {Icon && <Icon size={18} strokeWidth={1.8} style={{ color: COLORS.primary }} />}
        </div>
        <div className="text-[9px] uppercase tracking-wider px-2 py-1 rounded-md shrink-0 font-semibold" style={{ backgroundColor: COLORS.bgSoft, color: COLORS.accent, border: `1px solid ${COLORS.border}` }}>{badge}</div>
      </div>
      <div className="text-lg mb-2 leading-tight" style={{ color: COLORS.primary, fontFamily: STYLES.serif, fontWeight: 600 }}>{title}</div>
      <p className="text-xs leading-relaxed mb-4" style={{ color: COLORS.textMuted }}>{desc}</p>
      <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-semibold" style={{ color: COLORS.primary }}>
        <span>Abrir</span>
        <ChevronRight size={12} strokeWidth={2.5} className="transition-transform group-hover:translate-x-1" />
      </div>
    </button>
  );
}

function BackBtn({ onClick, label = "Volver" }) {
  return (
    <button onClick={onClick} className="text-xs uppercase tracking-wider mb-5 sm:mb-6 inline-flex items-center gap-2 transition-all hover:opacity-70 active:scale-95 group" style={{ color: COLORS.textMuted, fontWeight: 500 }}>
      <ArrowLeft size={14} strokeWidth={2} className="transition-transform group-hover:-translate-x-0.5" />
      {label}
    </button>
  );
}

function Pill({ icon: Icon, text }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs" style={{ backgroundColor: COLORS.bgCard, border: `1px solid ${COLORS.border}`, color: COLORS.textMuted, fontWeight: 500 }}>
      {Icon && <Icon size={11} style={{ color: COLORS.accent }} />}
      <span>{text}</span>
    </div>
  );
}

function HomeView({ setView, setSelectedBlock, stats }) {
  const pctTotal = stats.answered ? Math.round((stats.correct / stats.answered) * 100) : 0;

  return (
    <div className="space-y-8 sm:space-y-12">

      {/* ─── HERO CARD ─── */}
      <section className="cbr-fade-up rounded-2xl overflow-hidden relative" style={{ backgroundColor: COLORS.primary, minHeight: '21rem' }}>

        {/* Foto (dos personas) — máxima calidad, fade izquierdo */}
        <div className="absolute right-0 top-0 h-full" style={{ width: '46%' }}>
          <img
            src="https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?w=1400&fit=crop"
            alt=""
            className="w-full h-full object-cover object-top"
            onError={e => { e.currentTarget.style.display = 'none'; }}
          />
          <div className="absolute inset-0" style={{ background: `linear-gradient(to right, ${COLORS.primary} 0%, ${COLORS.primary}c0 12%, ${COLORS.primary}40 45%, transparent 72%)` }} />
          <div className="absolute bottom-0 left-0 right-0" style={{ height: '4rem', background: `linear-gradient(to top, ${COLORS.primary}, transparent)` }} />
        </div>

        {/* Contenido principal */}
        <div className="relative px-6 sm:px-8 pt-7 pb-6" style={{ paddingRight: 'max(5rem, 47%)' }}>
          <h1 style={{ color: '#fff', fontFamily: STYLES.serif, fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.0, marginBottom: '0.9rem', fontSize: 'clamp(2rem, 7vw, 3.25rem)' }}>
            Prepárate<br />para el <span style={{ color: COLORS.accent }}>JTBR</span>
          </h1>
          <div className="rounded-full mb-3" style={{ width: '2rem', height: '2px', backgroundColor: COLORS.accent }} />
          <p className="text-sm leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.52)' }}>
            Todo lo que necesitas para aprobar. Contenido actualizado, herramientas y práctica real.
          </p>

          {/* Features */}
          <div className="flex flex-col gap-1.5 mb-5">
            {[
              { icon: BookOpen,   label: 'Contenido confiable' },
              { icon: Calculator, label: 'Herramientas inteligentes' },
              { icon: TrendingUp, label: 'Práctica que te acerca al éxito' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2">
                <Icon size={11} style={{ color: COLORS.accent }} strokeWidth={2} />
                <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.65)', fontWeight: 500 }}>{label}</span>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setView('blocks')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs tracking-wider uppercase font-semibold transition-all active:scale-95"
              style={{ backgroundColor: COLORS.accent, color: COLORS.primary, boxShadow: `0 4px 14px ${COLORS.accent}40` }}>
              Estudiar <ChevronRight size={13} strokeWidth={2.5} />
            </button>
            <button onClick={() => setView('exam')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs tracking-wider uppercase font-semibold transition-all active:scale-95"
              style={{ backgroundColor: 'rgba(255,255,255,0.09)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }}>
              <Trophy size={13} strokeWidth={2} /> Simulacro
            </button>
          </div>
        </div>

        {/* Strip inferior — progreso o conteo de preguntas */}
        <div className="relative mx-6 sm:mx-8 mb-6">
          {stats.answered > 0 ? (
            <div className="grid grid-cols-3 gap-px rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
              {[
                { label: 'Respondidas', value: `${stats.answered}/${stats.total}`, icon: ListChecks, accent: false },
                { label: 'Correctas',   value: stats.correct,                       icon: Check,      accent: false },
                { label: 'Acierto',     value: `${pctTotal}%`,                      icon: Target,     accent: true },
              ].map(({ label, value, icon: Icon, accent: isAccent }) => (
                <div key={label} className="py-3 px-3" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                  <div className="flex items-center gap-1 mb-1">
                    <Icon size={9} style={{ color: isAccent ? COLORS.accent : 'rgba(255,255,255,0.35)' }} />
                    <div className="text-[9px] uppercase tracking-[0.12em]" style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>{label}</div>
                  </div>
                  <div className="text-base sm:text-lg leading-tight" style={{ color: isAccent ? COLORS.accent : '#fff', fontFamily: STYLES.serif, fontWeight: 600 }}>{value}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-3 py-2.5 px-4 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <span style={{ color: COLORS.accent, fontFamily: STYLES.serif, fontWeight: 700, fontSize: '1.1rem' }}>{stats.total}</span>
              <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.42)' }}>preguntas verificadas · Empieza cuando quieras</span>
            </div>
          )}
        </div>
      </section>

      {/* ─── MODOS ─── */}
      <section className="cbr-fade-up cbr-stagger-1">
        <SectionHeader pre="Modos de estudio" title="¿Cómo quieres trabajar hoy?" icon={Compass} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px rounded-xl overflow-hidden" style={{ backgroundColor: COLORS.border }}>
          <ModeCard num="01" icon={BookOpen} title="Estudio por bloques" desc="Recorre las preguntas secuencialmente con explicación legal, contexto y fundamento detallado." action="Empezar" onClick={() => setView('blocks')} />
          <ModeCard num="02" icon={Brain} title="Quiz aleatorio" desc="Pon a prueba tu conocimiento con preguntas mezcladas. Retroalimentación inmediata." action="Hacer quiz" onClick={() => setView('quiz')} />
          <ModeCard num="03" icon={Layers} title="Flashcards" desc="Tarjetas con datos clave: cifras, plazos, normas. Ideales para repaso rápido." action="Repasar" onClick={() => setView('flashcards')} />
          <ModeCard num="04" icon={Trophy} title="Simulador de examen" desc="40 preguntas aleatorias, 60 minutos cronometrados, mínimo 71% para aprobar como en el real." action="Iniciar simulacro" onClick={() => setView('exam')} highlight pulse />
        </div>
      </section>

      {/* ─── HERRAMIENTAS ─── */}
      <section className="cbr-fade-up cbr-stagger-2">
        <SectionHeader pre="Herramientas" title="Recursos avanzados" icon={Zap} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px rounded-xl overflow-hidden" style={{ backgroundColor: COLORS.border }}>
          <ToolCard icon={Library} title="Biblioteca por bloques" desc="Material completo organizado por los 10 bloques del temario: tablas, fórmulas, plazos y normas." badge={`${Object.keys(RESOURCES).length} guías`} onClick={() => setView('resources')} />
          <ToolCard icon={Calculator} title="Calculadora tributaria" desc="ITBI, Ganancia de Capital, Patrimonio Familiar y catastral actualizado paso a paso." badge="Permitida en examen" onClick={() => setView('calculator')} />
          <ToolCard icon={AlertCircle} title="Mis errores" desc="Repasa solo las preguntas que has fallado. La práctica enfocada acelera el aprendizaje." badge={`${stats.errorsCount} pendientes`} onClick={() => setView('errors')} />
        </div>
      </section>

      {/* ─── BLOQUES ─── */}
      <section className="cbr-fade-up cbr-stagger-3">
        <SectionHeader pre="Avance temático" title="Los diez bloques del examen" icon={ScrollText} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px rounded-xl overflow-hidden" style={{ backgroundColor: COLORS.border }}>
          {stats.byBlock.map(b => {
            const Icon = BLOCK_ICONS[b.id] || BookOpen;
            return (
              <button key={b.id} onClick={() => { setSelectedBlock(b.id); setView('study'); }} className="p-5 text-left transition-all hover:opacity-95 active:scale-[0.98] group" style={{ backgroundColor: COLORS.bgCard }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl transition-transform group-hover:scale-110" style={{ backgroundColor: COLORS.bgSoft, border: `1px solid ${COLORS.border}` }}>
                    <Icon size={18} strokeWidth={1.8} style={{ color: COLORS.primary }} />
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] tracking-[0.2em] uppercase" style={{ color: COLORS.textLight, fontWeight: 600 }}>Bloque {String(b.id).padStart(2,'0')}</div>
                    <div className="text-base mt-0.5" style={{ color: COLORS.accent, fontFamily: STYLES.serif, fontWeight: 600 }}>{b.pct}%</div>
                  </div>
                </div>
                <div className="text-xl mb-1 leading-tight" style={{ color: COLORS.primary, fontFamily: STYLES.serif, fontWeight: 600 }}>{b.name}</div>
                <div className="text-xs mb-3" style={{ color: COLORS.textMuted }}>{b.full}</div>
                <div className="h-px mb-3" style={{ backgroundColor: COLORS.border }} />
                <div className="text-xs flex items-center justify-between" style={{ color: COLORS.textMuted }}>
                  <span>{b.answered} de {b.total} preguntas</span>
                  <ChevronRight size={12} className="transition-transform group-hover:translate-x-0.5" style={{ color: COLORS.textLight }} />
                </div>
                <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ backgroundColor: COLORS.bgSoft }}>
                  <div className="h-full transition-all" style={{ width: `${b.pct}%`, backgroundColor: COLORS.accent }} />
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function BlocksView({ setView, setSelectedBlock, stats }) {
  return (
    <div className="cbr-fade-up">
      <BackBtn onClick={() => setView('home')} label="Volver al inicio" />
      <SectionHeader pre="Estudia por bloque" title="Selecciona un área" icon={BookOpen} />
      <div className="space-y-px mt-2 rounded-xl overflow-hidden" style={{ backgroundColor: COLORS.border }}>
        {stats.byBlock.map(b => {
          const Icon = BLOCK_ICONS[b.id] || BookOpen;
          return (
            <button key={b.id} onClick={() => { setSelectedBlock(b.id); setView('study'); }} className="w-full p-4 sm:p-5 text-left flex items-center gap-3 sm:gap-5 transition-all hover:opacity-95 active:scale-[0.99] group" style={{ backgroundColor: COLORS.bgCard }}>
              <div className="flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-xl shrink-0" style={{ backgroundColor: COLORS.bgSoft, border: `1px solid ${COLORS.border}` }}>
                <Icon size={18} strokeWidth={1.8} style={{ color: COLORS.primary }} />
              </div>
              <div className="text-2xl sm:text-3xl w-9 sm:w-12 shrink-0" style={{ color: COLORS.accent, fontFamily: STYLES.serif, fontWeight: 600 }}>{String(b.id).padStart(2,'0')}</div>
              <div className="flex-1 min-w-0">
                <div className="text-base sm:text-xl mb-0.5 leading-tight truncate" style={{ color: COLORS.primary, fontFamily: STYLES.serif, fontWeight: 600 }}>{b.full}</div>
                <div className="text-[11px] sm:text-xs flex flex-wrap items-center gap-x-2 gap-y-0.5" style={{ color: COLORS.textMuted }}>
                  <span>{b.total} preguntas</span><span style={{ color: COLORS.textLight }}>·</span>
                  <span style={{ color: b.pct >= 71 ? COLORS.success : COLORS.textMuted, fontWeight: 600 }}>{b.pct}%</span>
                </div>
              </div>
              <div className="hidden sm:block w-20 h-1.5 shrink-0 rounded-full overflow-hidden" style={{ backgroundColor: COLORS.bgSoft }}>
                <div className="h-full" style={{ width: `${b.pct}%`, backgroundColor: COLORS.accent }} />
              </div>
              <ChevronRight size={16} style={{ color: COLORS.textLight }} className="transition-transform group-hover:translate-x-1 shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function QuestionCard({ q, selected, showAnswer, onSelect }) {
  const Icon = BLOCK_ICONS[q.block] || BookOpen;
  return (
    <div className="p-5 sm:p-7 rounded-xl" style={{ backgroundColor: COLORS.bgCard, border: `1px solid ${COLORS.border}`, boxShadow: `0 1px 3px ${COLORS.primary}08` }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg" style={{ backgroundColor: COLORS.bgSoft, border: `1px solid ${COLORS.border}` }}>
          <Icon size={13} style={{ color: COLORS.accent }} strokeWidth={2} />
        </div>
        <div className="text-[10px] uppercase tracking-wider" style={{ color: COLORS.accent, fontWeight: 600 }}>Bloque {q.block} · {q.topic}</div>
      </div>
      {q.ctx && (
        <div className="mb-5 p-3 sm:p-4 text-sm leading-relaxed italic flex gap-3 rounded-lg" style={{ backgroundColor: COLORS.bgSoft, borderLeft: `3px solid ${COLORS.accent}`, color: COLORS.textMuted }}>
          <Lightbulb size={16} style={{ color: COLORS.accent }} className="shrink-0 mt-0.5" strokeWidth={2} />
          <div>
            <span className="text-[10px] not-italic uppercase tracking-wider block mb-1" style={{ color: COLORS.accent, fontWeight: 600 }}>Contexto</span>
            {q.ctx}
          </div>
        </div>
      )}
      <div className="text-lg sm:text-xl md:text-2xl leading-snug mb-6" style={{ color: COLORS.primary, fontFamily: STYLES.serif, fontWeight: 600 }}>{q.q}</div>
      <div className="space-y-2">
        {q.o.map((opt, i) => {
          const isCorrect = i === q.a;
          const isSelected = selected === i;
          let bgColor = COLORS.bgCard, borderColor = COLORS.border, opacity = 1;
          if (showAnswer) {
            if (isCorrect) { bgColor = COLORS.successBg; borderColor = COLORS.success; }
            else if (isSelected) { bgColor = COLORS.errorBg; borderColor = COLORS.error; }
            else opacity = 0.5;
          } else if (isSelected) { borderColor = COLORS.accent; bgColor = COLORS.bgSoft; }
          return (
            <button key={i} onClick={() => onSelect(i)} disabled={showAnswer} className="w-full text-left p-3 sm:p-4 transition-all rounded-lg active:scale-[0.99]" style={{ backgroundColor: bgColor, border: `1px solid ${borderColor}`, opacity }}>
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-7 h-7 shrink-0 flex items-center justify-center rounded-full text-xs font-semibold" style={{ backgroundColor: showAnswer && isCorrect ? COLORS.success : showAnswer && isSelected ? COLORS.error : isSelected ? COLORS.accent : 'transparent', color: showAnswer && (isCorrect || isSelected) ? COLORS.bgCard : isSelected ? COLORS.bgCard : COLORS.textLight, border: `1.5px solid ${showAnswer && isCorrect ? COLORS.success : showAnswer && isSelected ? COLORS.error : isSelected ? COLORS.accent : COLORS.border}` }}>
                  {['a','b','c','d'][i]}
                </div>
                <div className="text-sm leading-relaxed flex-1" style={{ color: COLORS.text }}>{opt}</div>
                {showAnswer && isCorrect && <CheckCircle2 size={18} style={{ color: COLORS.success }} className="shrink-0" />}
                {showAnswer && isSelected && !isCorrect && <XCircle size={18} style={{ color: COLORS.error }} className="shrink-0" />}
              </div>
            </button>
          );
        })}
      </div>
      {showAnswer && (
        <div className="mt-6 pt-6 cbr-fade-up" style={{ borderTop: `1px solid ${COLORS.border}` }}>
          <div className="flex items-center gap-2 mb-3">
            {selected === q.a ? <CheckCircle2 size={16} style={{ color: COLORS.success }} /> : <XCircle size={16} style={{ color: COLORS.error }} />}
            <div className="text-[10px] tracking-[0.2em] uppercase" style={{ color: selected === q.a ? COLORS.success : COLORS.error, fontWeight: 600 }}>{selected === q.a ? "Respondiste correctamente" : "Análisis del error"}</div>
          </div>
          {selected !== q.a && (
            <div className="mb-3 p-3 sm:p-4 text-sm rounded-lg" style={{ backgroundColor: COLORS.errorBg, borderLeft: `3px solid ${COLORS.error}`, color: COLORS.text }}>
              <div className="mb-2"><strong style={{ color: COLORS.error }}>Tu respuesta:</strong> {q.o[selected]}</div>
              <div><strong style={{ color: COLORS.success }}>Correcta:</strong> {q.o[q.a]}</div>
            </div>
          )}
          <div className="flex gap-3 text-sm leading-relaxed" style={{ color: COLORS.text }}>
            <Quote size={14} style={{ color: COLORS.accent }} className="shrink-0 mt-1" />
            <p className="italic" style={{ fontFamily: STYLES.serif, fontSize: '15px' }}>{q.exp}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function StudyView({ block, setView, progress, recordAnswer }) {
  const blockData = BLOCKS.find(b => b.id === block);
  const Icon = BLOCK_ICONS[block] || BookOpen;
  const questions = useMemo(() => QUESTIONS.filter(q => q.block === block), [block]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const q = questions[idx];

  const onSelect = (i) => {
    if (showAnswer) return;
    setSelected(i); setShowAnswer(true);
    recordAnswer(q.id, i === q.a);
  };
  const next = () => {
    if (idx < questions.length - 1) { setIdx(idx + 1); setSelected(null); setShowAnswer(false); }
    else setView('blocks');
  };
  const prev = () => { if (idx > 0) { setIdx(idx - 1); setSelected(null); setShowAnswer(false); } };

  return (
    <div className="cbr-fade-up">
      <BackBtn onClick={() => setView('blocks')} label="Volver a bloques" />
      <div className="mb-5 sm:mb-6 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-xl shrink-0" style={{ backgroundColor: COLORS.primary }}>
            <Icon size={20} style={{ color: COLORS.accent }} strokeWidth={1.8} />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] tracking-[0.2em] uppercase" style={{ color: COLORS.accent, fontWeight: 600 }}>Bloque {String(block).padStart(2,'0')}</div>
            <h1 className="text-lg sm:text-2xl leading-tight" style={{ color: COLORS.primary, fontFamily: STYLES.serif, fontWeight: 600 }}>{blockData.full}</h1>
          </div>
        </div>
        <div className="text-xs text-right shrink-0" style={{ color: COLORS.textMuted }}>
          <div className="uppercase tracking-wider text-[10px]" style={{ fontWeight: 600 }}>Pregunta</div>
          <div className="text-xl sm:text-2xl mt-0.5" style={{ color: COLORS.primary, fontFamily: STYLES.serif, fontWeight: 600 }}>{idx + 1}<span style={{ color: COLORS.textLight, fontSize: '0.7em' }}>/{questions.length}</span></div>
        </div>
      </div>
      <div className="h-1.5 mb-5 sm:mb-6 rounded-full overflow-hidden" style={{ backgroundColor: COLORS.bgSoft }}>
        <div className="h-full transition-all" style={{ width: `${((idx + 1) / questions.length) * 100}%`, backgroundColor: COLORS.accent }} />
      </div>
      <QuestionCard q={q} selected={selected} showAnswer={showAnswer} onSelect={onSelect} />
      <div className="mt-5 sm:mt-6 flex justify-between gap-3">
        <SecondaryButton onClick={prev} disabled={idx === 0} icon={ArrowLeft} size="sm">Anterior</SecondaryButton>
        <PrimaryButton onClick={next} icon={idx === questions.length - 1 ? Check : ChevronRight} size="sm">{idx === questions.length - 1 ? 'Finalizar' : 'Siguiente'}</PrimaryButton>
      </div>
    </div>
  );
}

function QuizView({ setView, recordAnswer }) {
  const [num, setNum] = useState(10);
  const [blockFilter, setBlockFilter] = useState('all');
  const [started, setStarted] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const start = () => {
    let pool = QUESTIONS;
    if (blockFilter !== 'all') pool = QUESTIONS.filter(q => q.block === parseInt(blockFilter));
    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, num);
    setQuestions(shuffled); setStarted(true); setIdx(0); setSelected(null); setShowAnswer(false); setScore(0); setDone(false);
  };

  const onSelect = (i) => {
    if (showAnswer) return;
    const q = questions[idx];
    setSelected(i); setShowAnswer(true);
    if (i === q.a) setScore(s => s + 1);
    recordAnswer(q.id, i === q.a);
  };
  const next = () => {
    if (idx < questions.length - 1) { setIdx(idx + 1); setSelected(null); setShowAnswer(false); }
    else setDone(true);
  };

  if (!started) {
    return (
      <div className="cbr-fade-up">
        <BackBtn onClick={() => setView('home')} />
        <SectionHeader pre="Quiz aleatorio" title="Configura tu sesión" icon={Brain} />
        <div className="space-y-6 max-w-xl">
          <div>
            <label className="text-xs uppercase tracking-wider flex items-center gap-2 mb-3" style={{ color: COLORS.textMuted, fontWeight: 600 }}><ListChecks size={12} /> Número de preguntas</label>
            <div className="grid grid-cols-4 gap-px rounded-xl overflow-hidden" style={{ backgroundColor: COLORS.border }}>
              {[5, 10, 20, 40].map(n => (
                <button key={n} onClick={() => setNum(n)} className="py-3 text-base sm:text-lg transition-all active:scale-95" style={{ backgroundColor: num === n ? COLORS.primary : COLORS.bgCard, color: num === n ? COLORS.accent : COLORS.text, fontWeight: num === n ? 700 : 500, fontFamily: STYLES.serif }}>{n}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider flex items-center gap-2 mb-3" style={{ color: COLORS.textMuted, fontWeight: 600 }}><BookOpen size={12} /> Filtrar por bloque</label>
            <div className="relative">
              <select value={blockFilter} onChange={e => setBlockFilter(e.target.value)} className="w-full p-3 pr-10 text-sm appearance-none cursor-pointer rounded-lg" style={{ backgroundColor: COLORS.bgCard, border: `1px solid ${COLORS.border}`, color: COLORS.text, fontFamily: STYLES.sans }}>
                <option value="all">Todos los bloques</option>
                {BLOCKS.map(b => <option key={b.id} value={b.id}>Bloque {b.id} — {b.full}</option>)}
              </select>
              <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" style={{ color: COLORS.textLight }} />
            </div>
          </div>
          <PrimaryButton onClick={start} icon={Zap} fullWidth size="lg">Iniciar quiz</PrimaryButton>
        </div>
      </div>
    );
  }

  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    const passed = pct >= 71;
    return (
      <div className="text-center py-8 sm:py-10 cbr-fade-up">
        <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 rounded-full" style={{ backgroundColor: passed ? COLORS.successBg : COLORS.errorBg, border: `2px solid ${passed ? COLORS.success : COLORS.error}` }}>
          {passed ? <Trophy size={32} style={{ color: COLORS.success }} /> : <Target size={32} style={{ color: COLORS.error }} />}
        </div>
        <div className="text-xs tracking-[0.3em] uppercase mb-3" style={{ color: COLORS.accent, fontWeight: 600 }}>Resultado</div>
        <div className="text-6xl sm:text-7xl mb-3" style={{ color: COLORS.primary, fontFamily: STYLES.serif, fontWeight: 600 }}>{pct}%</div>
        <div className="text-sm mb-8" style={{ color: COLORS.textMuted }}>{score} de {questions.length} correctas</div>
        <div className="flex gap-3 justify-center flex-wrap">
          <PrimaryButton onClick={start} icon={RefreshCw} iconPos="left">Nuevo quiz</PrimaryButton>
          <SecondaryButton onClick={() => { setStarted(false); setView('home'); }} icon={Home} iconPos="left">Inicio</SecondaryButton>
        </div>
      </div>
    );
  }

  const q = questions[idx];
  return (
    <div>
      <BackBtn onClick={() => setStarted(false)} label="Salir del quiz" />
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider" style={{ color: COLORS.textMuted, fontWeight: 600 }}>
          <Brain size={14} style={{ color: COLORS.accent }} />
          <span>{idx + 1} de {questions.length}</span>
        </div>
        <div className="flex items-center gap-2 text-xs" style={{ color: COLORS.accent, fontWeight: 600 }}>
          <Check size={14} />
          Aciertos: {score}
        </div>
      </div>
      <div className="h-1.5 mb-5 sm:mb-6 rounded-full overflow-hidden" style={{ backgroundColor: COLORS.bgSoft }}>
        <div className="h-full transition-all" style={{ width: `${((idx + 1) / questions.length) * 100}%`, backgroundColor: COLORS.accent }} />
      </div>
      <QuestionCard q={q} selected={selected} showAnswer={showAnswer} onSelect={onSelect} />
      {showAnswer && (
        <div className="mt-5 sm:mt-6 flex justify-end">
          <PrimaryButton onClick={next} icon={idx === questions.length - 1 ? Trophy : ChevronRight}>
            {idx === questions.length - 1 ? 'Ver resultado' : 'Siguiente'}
          </PrimaryButton>
        </div>
      )}
    </div>
  );
}

function FlashcardsView({ setView }) {
  const [filter, setFilter] = useState('all');
  const cards = useMemo(() => {
    let pool = QUESTIONS;
    if (filter !== 'all') pool = QUESTIONS.filter(q => q.block === parseInt(filter));
    return [...pool].sort(() => Math.random() - 0.5);
  }, [filter]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const c = cards[idx];

  if (!c) return null;
  const Icon = BLOCK_ICONS[c.block] || BookOpen;

  return (
    <div className="cbr-fade-up">
      <BackBtn onClick={() => setView('home')} />
      <div className="flex items-end justify-between mb-5 sm:mb-6 gap-4">
        <SectionHeader pre="Repaso rápido" title="Flashcards" icon={Layers} />
        <div className="relative shrink-0 mb-1">
          <select value={filter} onChange={e => { setFilter(e.target.value); setIdx(0); setFlipped(false); }} className="p-2 pr-8 text-sm appearance-none cursor-pointer rounded-lg" style={{ backgroundColor: COLORS.bgCard, border: `1px solid ${COLORS.border}`, color: COLORS.text, fontFamily: STYLES.sans }}>
            <option value="all">Todos</option>
            {BLOCKS.map(b => <option key={b.id} value={b.id}>Bloque {b.id}</option>)}
          </select>
          <ChevronRight size={12} className="absolute right-2 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" style={{ color: COLORS.textLight }} />
        </div>
      </div>
      <div className="text-xs mb-3 sm:mb-4 flex items-center justify-between" style={{ color: COLORS.textMuted }}>
        <span>{idx + 1} / {cards.length}</span>
        <span className="flex items-center gap-1.5">
          <Eye size={12} /> Toca para girar
        </span>
      </div>
      <div onClick={() => setFlipped(!flipped)} className="cursor-pointer p-6 sm:p-12 min-h-[380px] sm:min-h-[420px] flex flex-col justify-center transition-all rounded-2xl relative overflow-hidden active:scale-[0.99]"
        style={{ backgroundColor: flipped ? COLORS.primary : COLORS.bgCard, border: `1px solid ${COLORS.border}`, boxShadow: `0 4px 12px ${COLORS.primary}15` }}>
        <div className="absolute top-5 right-5">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl" style={{ backgroundColor: flipped ? COLORS.primaryDark : COLORS.bgSoft, border: `1px solid ${flipped ? COLORS.accent + '44' : COLORS.border}` }}>
            <Icon size={18} style={{ color: COLORS.accent }} />
          </div>
        </div>
        <div className="text-[10px] tracking-[0.3em] uppercase mb-4 flex items-center gap-2" style={{ color: COLORS.accent, fontWeight: 600 }}>
          {flipped ? <Check size={12} /> : <Quote size={12} />}
          {flipped ? 'Respuesta' : 'Pregunta'} · Bloque {c.block}
        </div>
        {!flipped ? (
          <div className="text-xl sm:text-2xl md:text-3xl leading-snug pr-12" style={{ color: COLORS.primary, fontFamily: STYLES.serif, fontWeight: 600 }}>{c.q}</div>
        ) : (
          <div className="pr-12">
            <div className="text-xl sm:text-2xl mb-4 leading-snug" style={{ color: COLORS.accent, fontFamily: STYLES.serif, fontWeight: 600 }}>{c.o[c.a]}</div>
            <div className="text-sm leading-relaxed italic" style={{ color: '#e0e0e0', fontFamily: STYLES.serif, fontSize: '15px' }}>{c.exp}</div>
          </div>
        )}
        <div className="mt-6 text-[10px] tracking-wider uppercase flex items-center gap-2" style={{ color: flipped ? COLORS.accent : COLORS.textLight, fontWeight: 600 }}>
          <RotateCcw size={11} />
          {flipped ? 'Volver a la pregunta' : 'Ver respuesta'}
        </div>
      </div>
      <div className="mt-5 sm:mt-6 flex justify-between gap-3">
        <SecondaryButton onClick={() => { if (idx > 0) { setIdx(idx - 1); setFlipped(false); } }} disabled={idx === 0} icon={ArrowLeft} size="sm">Anterior</SecondaryButton>
        <PrimaryButton onClick={() => { if (idx < cards.length - 1) { setIdx(idx + 1); setFlipped(false); } else { setIdx(0); setFlipped(false); } }} icon={idx === cards.length - 1 ? RefreshCw : ChevronRight} size="sm">
          {idx === cards.length - 1 ? 'Reiniciar' : 'Siguiente'}
        </PrimaryButton>
      </div>
    </div>
  );
}

function ExamView({ setView, examHistory, saveHistory, recordAnswer }) {
  const [phase, setPhase] = useState('intro');
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [idx, setIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60 * 60);
  const [result, setResult] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const finish = useCallback(() => {
    let correct = 0;
    questions.forEach((q, i) => { if (answers[i] === q.a) correct++; recordAnswer(q.id, answers[i] === q.a); });
    const pct = Math.round((correct / questions.length) * 100);
    const passed = pct >= 71;
    const r = { date: Date.now(), score: correct, total: questions.length, pct, passed };
    setResult(r);
    saveHistory([...examHistory, r].slice(-20));
    setPhase('done');
  }, [questions, answers, examHistory, saveHistory, recordAnswer]);

  useEffect(() => {
    if (phase !== 'taking') return;
    const t = setInterval(() => setTimeLeft(s => { if (s <= 1) { finish(); return 0; } return s - 1; }), 1000);
    return () => clearInterval(t);
  }, [phase, finish]);

  const start = () => {
    const shuffled = [...QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 40);
    setQuestions(shuffled); setAnswers({}); setIdx(0); setTimeLeft(60 * 60); setPhase('taking');
  };

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;

  if (phase === 'intro') {
    return (
      <div className="cbr-fade-up">
        <BackBtn onClick={() => setView('home')} />
        <div className="flex items-start gap-3 sm:gap-4 mb-3">
          <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-xl shrink-0 cbr-pulse-glow" style={{ backgroundColor: COLORS.primary, boxShadow: `0 2px 8px ${COLORS.primary}30` }}>
            <Trophy size={20} style={{ color: COLORS.accent }} strokeWidth={1.8} />
          </div>
          <div>
            <div className="text-[10px] tracking-[0.3em] uppercase" style={{ color: COLORS.accent, fontWeight: 600 }}>Simulacro</div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl leading-tight tracking-tight" style={{ color: COLORS.primary, fontFamily: STYLES.serif, fontWeight: 600 }}>Simulador de examen</h1>
          </div>
        </div>
        <p className="mb-6 sm:mb-8 max-w-2xl text-sm sm:text-base leading-relaxed" style={{ color: COLORS.textMuted }}>40 preguntas seleccionadas aleatoriamente, 60 minutos cronometrados, mínimo 71% para aprobar.</p>
        <div className="p-5 sm:p-6 mb-6 max-w-2xl rounded-xl" style={{ backgroundColor: COLORS.bgCard, border: `1px solid ${COLORS.border}`, boxShadow: `0 1px 3px ${COLORS.primary}08` }}>
          <div className="flex items-center gap-2 text-[10px] tracking-[0.3em] uppercase mb-4" style={{ color: COLORS.accent, fontWeight: 600 }}>
            <ListChecks size={12} /> Reglas del simulacro
          </div>
          <ul className="space-y-3 text-sm" style={{ color: COLORS.text }}>
            <RuleItem icon={ListChecks}>40 preguntas aleatorias de los 10 bloques</RuleItem>
            <RuleItem icon={Clock}>60 minutos · auto-finaliza al agotarse</RuleItem>
            <RuleItem icon={Compass}>Puedes navegar y revisar antes de entregar</RuleItem>
            <RuleItem icon={Target}>Mínimo 71% (29 correctas) para aprobar</RuleItem>
            <RuleItem icon={Eye}>No verás las respuestas hasta entregar</RuleItem>
          </ul>
        </div>
        {examHistory.length > 0 && (
          <div className="mb-6 max-w-2xl">
            <div className="flex items-center gap-2 text-[10px] tracking-[0.3em] uppercase mb-3" style={{ color: COLORS.accent, fontWeight: 600 }}>
              <BarChart3 size={12} /> Tu historial reciente
            </div>
            <div className="space-y-px rounded-xl overflow-hidden" style={{ backgroundColor: COLORS.border }}>
              {[...examHistory].reverse().slice(0, 5).map((h, i) => (
                <div key={i} className="p-3 flex justify-between items-center text-sm" style={{ backgroundColor: COLORS.bgCard }}>
                  <div className="flex items-center gap-2">
                    <Clock size={12} style={{ color: COLORS.textLight }} />
                    <span style={{ color: COLORS.textMuted }}>{new Date(h.date).toLocaleDateString('es-PA')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {h.passed ? <CheckCircle2 size={14} style={{ color: COLORS.success }} /> : <XCircle size={14} style={{ color: COLORS.error }} />}
                    <span style={{ color: h.passed ? COLORS.success : COLORS.error, fontWeight: 600 }}>{h.pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <PrimaryButton onClick={start} icon={Zap} size="lg" pulse>Comenzar examen</PrimaryButton>
      </div>
    );
  }

  if (phase === 'taking') {
    const q = questions[idx];
    const Icon = BLOCK_ICONS[q.block] || BookOpen;
    const answered = Object.keys(answers).length;
    return (
      <div>
        <div className="flex items-center justify-between mb-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl" style={{ backgroundColor: COLORS.primary }}>
              <Trophy size={16} style={{ color: COLORS.accent }} strokeWidth={2} />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider" style={{ color: COLORS.textMuted, fontWeight: 600 }}>Examen</div>
              <div className="text-base sm:text-lg leading-tight" style={{ color: COLORS.primary, fontFamily: STYLES.serif, fontWeight: 600 }}>{idx + 1} / 40</div>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end gap-1.5 text-[10px] uppercase tracking-wider" style={{ color: COLORS.textMuted, fontWeight: 600 }}>
              <Clock size={12} /> Tiempo
            </div>
            <div className="font-mono text-xl sm:text-2xl" style={{ color: timeLeft < 300 ? COLORS.error : COLORS.primary, fontWeight: 600 }}>{fmt(timeLeft)}</div>
          </div>
        </div>
        <div className="h-1.5 mb-5 sm:mb-6 rounded-full overflow-hidden" style={{ backgroundColor: COLORS.bgSoft }}>
          <div className="h-full transition-all" style={{ width: `${(answered / 40) * 100}%`, backgroundColor: COLORS.accent }} />
        </div>
        <div className="p-5 sm:p-7 rounded-xl" style={{ backgroundColor: COLORS.bgCard, border: `1px solid ${COLORS.border}`, boxShadow: `0 1px 3px ${COLORS.primary}08` }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg" style={{ backgroundColor: COLORS.bgSoft, border: `1px solid ${COLORS.border}` }}>
              <Icon size={13} style={{ color: COLORS.accent }} strokeWidth={2} />
            </div>
            <div className="text-[10px] uppercase tracking-wider" style={{ color: COLORS.accent, fontWeight: 600 }}>Bloque {q.block} · {q.topic}</div>
          </div>
          {q.ctx && (
            <div className="mb-4 p-3 text-xs italic flex gap-2 rounded-lg" style={{ backgroundColor: COLORS.bgSoft, borderLeft: `3px solid ${COLORS.accent}`, color: COLORS.textMuted }}>
              <Lightbulb size={14} style={{ color: COLORS.accent }} className="shrink-0 mt-0.5" />
              <span>{q.ctx}</span>
            </div>
          )}
          <div className="text-lg sm:text-xl leading-snug mb-5 sm:mb-6" style={{ color: COLORS.primary, fontFamily: STYLES.serif, fontWeight: 600 }}>{q.q}</div>
          <div className="space-y-2">
            {q.o.map((opt, i) => {
              const isSelected = answers[idx] === i;
              return (
                <button key={i} onClick={() => setAnswers({...answers, [idx]: i})} className="w-full text-left p-3 sm:p-4 transition-all rounded-lg active:scale-[0.99]" style={{ backgroundColor: isSelected ? COLORS.bgSoft : COLORS.bgCard, border: `1px solid ${isSelected ? COLORS.accent : COLORS.border}` }}>
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="w-7 h-7 shrink-0 flex items-center justify-center rounded-full text-xs font-semibold" style={{ backgroundColor: isSelected ? COLORS.accent : 'transparent', color: isSelected ? COLORS.bgCard : COLORS.textLight, border: `1.5px solid ${isSelected ? COLORS.accent : COLORS.border}` }}>{['a','b','c','d'][i]}</div>
                    <div className="text-sm" style={{ color: COLORS.text }}>{opt}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        <div className="mt-5 sm:mt-6 flex flex-wrap gap-2 justify-between">
          <div className="flex gap-2">
            <SecondaryButton onClick={() => idx > 0 && setIdx(idx - 1)} disabled={idx === 0} icon={ArrowLeft} size="sm">Anterior</SecondaryButton>
            <SecondaryButton onClick={() => idx < 39 && setIdx(idx + 1)} disabled={idx === 39} icon={ArrowRight} iconPos="right" size="sm">Siguiente</SecondaryButton>
          </div>
          <PrimaryButton onClick={() => setShowConfirm(true)} icon={Trophy} size="sm">Entregar</PrimaryButton>
        </div>
        <div className="mt-6 flex items-center gap-2 text-[10px] uppercase tracking-wider mb-3" style={{ color: COLORS.textMuted, fontWeight: 600 }}>
          <Compass size={12} /> Mapa de preguntas
        </div>
        <div className="grid grid-cols-10 gap-1">
          {questions.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)} className="aspect-square text-xs transition-all rounded-md active:scale-95" style={{ backgroundColor: i === idx ? COLORS.primary : answers[i] !== undefined ? COLORS.accent : COLORS.bgSoft, color: i === idx ? COLORS.accent : answers[i] !== undefined ? COLORS.bgCard : COLORS.textMuted, border: `1px solid ${i === idx ? COLORS.primary : answers[i] !== undefined ? COLORS.accent : COLORS.border}`, fontWeight: 600 }}>{i + 1}</button>
          ))}
        </div>
        {showConfirm && (
          <div onClick={() => setShowConfirm(false)} className="fixed inset-0 z-50 flex items-center justify-center p-4 cbr-fade-up" style={{ backgroundColor: 'rgba(26,58,92,0.55)', backdropFilter: 'blur(4px)' }}>
            <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl p-6 sm:p-7" style={{ backgroundColor: COLORS.bgCard, boxShadow: `0 20px 60px ${COLORS.primary}40` }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl shrink-0" style={{ backgroundColor: COLORS.primary }}>
                  <Trophy size={20} style={{ color: COLORS.accent }} strokeWidth={1.8} />
                </div>
                <div>
                  <div className="text-[10px] tracking-[0.3em] uppercase" style={{ color: COLORS.accent, fontWeight: 600 }}>Confirmar</div>
                  <h3 className="text-xl leading-tight" style={{ color: COLORS.primary, fontFamily: STYLES.serif, fontWeight: 700 }}>¿Entregar examen?</h3>
                </div>
              </div>
              <p className="text-sm mb-2" style={{ color: COLORS.text }}>Has respondido <strong style={{ color: COLORS.primary }}>{answered} de 40</strong> preguntas.</p>
              {answered < 40 && (
                <p className="text-xs mb-5 p-3 rounded-lg" style={{ color: COLORS.textMuted, backgroundColor: COLORS.bgSoft, border: `1px solid ${COLORS.border}` }}>Las preguntas sin responder se contarán como incorrectas.</p>
              )}
              {answered === 40 && (
                <p className="text-xs mb-5" style={{ color: COLORS.textMuted }}>Has respondido todas las preguntas. Buena suerte.</p>
              )}
              <div className="flex gap-2 justify-end">
                <SecondaryButton onClick={() => setShowConfirm(false)} size="sm">Cancelar</SecondaryButton>
                <PrimaryButton onClick={() => { setShowConfirm(false); finish(); }} icon={Trophy} size="sm">Sí, entregar</PrimaryButton>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="text-center py-8 sm:py-10 cbr-fade-up">
      <div className="flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 rounded-full" style={{ backgroundColor: result.passed ? COLORS.successBg : COLORS.errorBg, border: `3px solid ${result.passed ? COLORS.success : COLORS.error}` }}>
        {result.passed ? <Trophy size={36} style={{ color: COLORS.success }} /> : <Target size={36} style={{ color: COLORS.error }} />}
      </div>
      <div className="text-xs tracking-[0.3em] uppercase mb-3" style={{ color: COLORS.accent, fontWeight: 600 }}>Resultado del examen</div>
      <div className="text-6xl sm:text-7xl mb-3" style={{ color: result.passed ? COLORS.success : COLORS.error, fontFamily: STYLES.serif, fontWeight: 600 }}>{result.pct}%</div>
      <div className="text-sm mb-2" style={{ color: COLORS.textMuted }}>{result.score} de {result.total} correctas</div>
      <div className="text-xl sm:text-2xl mb-7 sm:mb-8" style={{ color: result.passed ? COLORS.success : COLORS.error, fontFamily: STYLES.serif, fontWeight: 600 }}>{result.passed ? 'APROBADO' : 'No aprobado'}</div>
      <p className="text-sm mb-7 sm:mb-8 max-w-md mx-auto" style={{ color: COLORS.textMuted }}>{result.passed ? 'Excelente. Estás lista para el examen real. Sigue practicando para consolidar.' : 'Necesitas 71% para aprobar. Sigue practicando, especialmente las preguntas que fallaste.'}</p>
      <div className="flex gap-3 justify-center flex-wrap">
        <PrimaryButton onClick={start} icon={RefreshCw} iconPos="left">Nuevo intento</PrimaryButton>
        <SecondaryButton onClick={() => { setPhase('intro'); setView('home'); }} icon={Home} iconPos="left">Inicio</SecondaryButton>
      </div>
    </div>
  );
}

function RuleItem({ icon: Icon, children }) {
  return (
    <li className="flex items-start gap-3">
      <div className="flex items-center justify-center w-6 h-6 rounded-md shrink-0 mt-0.5" style={{ backgroundColor: COLORS.bgSoft }}>
        <Icon size={12} style={{ color: COLORS.accent }} />
      </div>
      <span>{children}</span>
    </li>
  );
}

function ErrorsView({ setView, errors, recordAnswer, removeFromErrors }) {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const errorQuestions = useMemo(() => errors.map(e => ({ ...QUESTIONS.find(q => q.id === e.qId), times: e.times })).filter(q => q.id), [errors]);

  if (errorQuestions.length === 0) {
    return (
      <div className="cbr-fade-up">
        <BackBtn onClick={() => setView('home')} />
        <div className="text-center py-12 sm:py-16">
          <div className="flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 rounded-full" style={{ backgroundColor: COLORS.successBg, border: `3px solid ${COLORS.success}` }}>
            <Trophy size={36} style={{ color: COLORS.success }} strokeWidth={1.8} />
          </div>
          <h1 className="text-2xl sm:text-3xl mb-3" style={{ color: COLORS.primary, fontFamily: STYLES.serif, fontWeight: 600 }}>Sin errores acumulados</h1>
          <p className="text-sm max-w-md mx-auto" style={{ color: COLORS.textMuted }}>Las preguntas que falles aparecerán aquí para que las practiques de forma enfocada hasta dominarlas.</p>
        </div>
      </div>
    );
  }

  const safeIdx = Math.min(idx, errorQuestions.length - 1);
  const q = errorQuestions[safeIdx];
  const onSelect = (i) => {
    if (showAnswer) return;
    setSelected(i); setShowAnswer(true);
    if (q) recordAnswer(q.id, i === q.a);
  };
  const next = () => {
    if (safeIdx < errorQuestions.length - 1) { setIdx(safeIdx + 1); setSelected(null); setShowAnswer(false); }
    else { setIdx(0); setSelected(null); setShowAnswer(false); }
  };
  const markLearned = () => {
    removeFromErrors(q.id);
    setSelected(null); setShowAnswer(false);
  };

  return (
    <div className="cbr-fade-up">
      <BackBtn onClick={() => setView('home')} />
      <div className="flex items-start gap-3 sm:gap-4 mb-3">
        <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-xl shrink-0" style={{ backgroundColor: COLORS.errorBg, border: `2px solid ${COLORS.error}` }}>
          <AlertCircle size={20} style={{ color: COLORS.error }} strokeWidth={1.8} />
        </div>
        <div>
          <div className="text-[10px] tracking-[0.3em] uppercase" style={{ color: COLORS.accent, fontWeight: 600 }}>Práctica enfocada</div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl leading-tight tracking-tight" style={{ color: COLORS.primary, fontFamily: STYLES.serif, fontWeight: 600 }}>Mis errores</h1>
        </div>
      </div>
      <div className="mb-5 sm:mb-6 flex flex-wrap items-center gap-2">
        <Pill icon={AlertCircle} text={`${errorQuestions.length} pendientes`} />
        <Pill icon={ListChecks} text={`${safeIdx + 1} de ${errorQuestions.length}`} />
        <Pill icon={RefreshCw} text={`Fallada ${q?.times || 1}x`} />
      </div>
      <div className="h-1.5 mb-5 sm:mb-6 rounded-full overflow-hidden" style={{ backgroundColor: COLORS.bgSoft }}>
        <div className="h-full" style={{ width: `${((safeIdx + 1) / errorQuestions.length) * 100}%`, backgroundColor: COLORS.accent }} />
      </div>
      {q && <QuestionCard q={q} selected={selected} showAnswer={showAnswer} onSelect={onSelect} />}
      <div className="mt-5 sm:mt-6 flex flex-wrap gap-3 justify-between">
        <SuccessButton onClick={markLearned} icon={Check}>Marcar aprendida</SuccessButton>
        {showAnswer && <PrimaryButton onClick={next} icon={ChevronRight}>Siguiente</PrimaryButton>}
      </div>
    </div>
  );
}

function ResourcesView({ setView }) {
  const [active, setActive] = useState(null);
  const keys = Object.keys(RESOURCES);

  if (active) {
    const r = RESOURCES[active];
    const Icon = RESOURCE_ICONS[active] || FileText;
    return (
      <div className="cbr-fade-up">
        <BackBtn onClick={() => setActive(null)} label="Volver a recursos" />
        <div className="flex items-start gap-3 sm:gap-4 mb-4">
          <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-xl shrink-0" style={{ backgroundColor: COLORS.primary, boxShadow: `0 2px 8px ${COLORS.primary}30` }}>
            <Icon size={20} style={{ color: COLORS.accent }} strokeWidth={1.8} />
          </div>
          <div>
            <div className="text-[10px] tracking-[0.3em] uppercase" style={{ color: COLORS.accent, fontWeight: 600 }}>{r.subtitle}</div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl leading-tight tracking-tight" style={{ color: COLORS.primary, fontFamily: STYLES.serif, fontWeight: 600 }}>{r.title}</h1>
          </div>
        </div>
        <p className="mb-7 sm:mb-8 max-w-3xl text-sm sm:text-base leading-relaxed" style={{ color: COLORS.textMuted }}>{r.desc}</p>
        <div className="space-y-7 sm:space-y-8">
          {r.tables.map((t, ti) => (
            <div key={ti}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-5" style={{ backgroundColor: COLORS.accent }} />
                <h2 className="text-lg sm:text-xl" style={{ color: COLORS.primary, fontFamily: STYLES.serif, fontWeight: 600 }}>{t.title}</h2>
              </div>
              <div className="overflow-x-auto rounded-xl cbr-no-scrollbar" style={{ border: `1px solid ${COLORS.border}` }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ backgroundColor: COLORS.primary, color: COLORS.accent }}>
                      {t.cols.map((c, ci) => <th key={ci} className="text-left p-3 text-xs uppercase tracking-wider whitespace-nowrap" style={{ fontWeight: 600 }}>{c}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {t.rows.map((row, ri) => (
                      <tr key={ri} style={{ backgroundColor: ri % 2 === 0 ? COLORS.bgCard : COLORS.bgSoft, borderTop: `1px solid ${COLORS.border}` }}>
                        {row.map((cell, ci) => <td key={ci} className="p-3 align-top" style={{ color: ci === 0 ? COLORS.primary : COLORS.text, fontWeight: ci === 0 ? 600 : 400, fontFamily: ci === 0 ? STYLES.serif : STYLES.sans }}>{cell}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Agrupar recursos por bloque
  const grouped = {};
  keys.forEach(k => {
    const b = RESOURCES[k].block;
    if (!grouped[b]) grouped[b] = [];
    grouped[b].push(k);
  });

  return (
    <div className="cbr-fade-up">
      <BackBtn onClick={() => setView('home')} />
      <SectionHeader pre="Biblioteca por bloques" title="Material de estudio" icon={Library} />
      <p className="mb-8 sm:mb-10 text-sm sm:text-base max-w-3xl" style={{ color: COLORS.textMuted }}>Biblioteca completa organizada por los 10 bloques del temario, con varias guías por bloque. Cada guía contiene tablas consultables con cifras, plazos, fórmulas y normas. {keys.length} guías en total.</p>

      <div className="space-y-10 sm:space-y-12">
        {BLOCKS.map((b, bi) => {
          const items = grouped[b.id] || [];
          if (items.length === 0) return null;
          const BIcon = BLOCK_ICONS[b.id] || FileText;
          return (
            <section key={b.id} className="cbr-fade-up" style={{ animationDelay: `${bi * 60}ms` }}>
              {/* Header del bloque */}
              <div className="flex items-center gap-3 sm:gap-4 mb-5 pb-4" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-xl shrink-0" style={{ backgroundColor: COLORS.primary, boxShadow: `0 2px 8px ${COLORS.primary}30` }}>
                  <BIcon size={22} style={{ color: COLORS.accent }} strokeWidth={1.8} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] tracking-[0.3em] uppercase mb-1" style={{ color: COLORS.accent, fontWeight: 700 }}>Bloque {b.id} · {items.length} {items.length === 1 ? 'guía' : 'guías'}</div>
                  <h2 className="text-lg sm:text-xl md:text-2xl leading-tight tracking-tight" style={{ color: COLORS.primary, fontFamily: STYLES.serif, fontWeight: 700 }}>{b.full || b.short}</h2>
                </div>
              </div>

              {/* Grid de recursos del bloque */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px rounded-xl overflow-hidden" style={{ backgroundColor: COLORS.border }}>
                {items.map(k => {
                  const r = RESOURCES[k];
                  const Icon = RESOURCE_ICONS[k] || FileText;
                  return (
                    <button key={k} onClick={() => setActive(k)} className="p-5 sm:p-6 text-left transition-all hover:opacity-95 active:scale-[0.98] group" style={{ backgroundColor: COLORS.bgCard }}>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center justify-center w-11 h-11 rounded-xl transition-transform group-hover:scale-110" style={{ backgroundColor: COLORS.bgSoft }}>
                          <Icon size={18} style={{ color: COLORS.primary }} strokeWidth={1.8} />
                        </div>
                        <ChevronRight size={16} style={{ color: COLORS.textLight }} className="transition-transform group-hover:translate-x-1" />
                      </div>
                      <h3 className="text-base sm:text-lg mb-2 leading-tight" style={{ color: COLORS.primary, fontFamily: STYLES.serif, fontWeight: 700, letterSpacing: '-0.01em' }}>{r.title}</h3>
                      <p className="text-xs sm:text-sm leading-relaxed mb-3" style={{ color: COLORS.textMuted }}>{r.desc.length > 130 ? r.desc.substring(0, 130) + '...' : r.desc}</p>
                      <div className="text-[10px] uppercase tracking-wider flex items-center gap-1" style={{ color: COLORS.accent, fontWeight: 700 }}>
                        <span>{r.tables.length} {r.tables.length === 1 ? 'tabla' : 'tablas'}</span>
                        <span style={{ color: COLORS.textLight }}>·</span>
                        <span style={{ color: COLORS.primary }}>Consultar</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function CalculatorView({ setView }) {
  const [tool, setTool] = useState(null);
  const tools = [
    { id: 'catastral', label: 'Valor catastral actualizado', desc: 'Calcula el catastral con la fórmula oficial', icon: TrendingUp },
    { id: 'itbi', label: 'ITBI 2%', desc: 'Sobre el mayor entre venta y catastral', icon: Receipt },
    { id: 'gc', label: 'Ganancia de Capital', desc: 'Compara 10% sobre ganancia vs 3% del precio', icon: Percent },
    { id: 'pft', label: 'Impuesto de Inmuebles PFT/VP', desc: 'Calcula el impuesto anual paso a paso', icon: Building2 },
    { id: 'completo', label: 'Cálculo completo de venta', desc: 'Catastral + ITBI + GC + comisión + neto', icon: FlaskConical },
  ];

  if (!tool) {
    return (
      <div className="cbr-fade-up">
        <BackBtn onClick={() => setView('home')} />
        <SectionHeader pre="Calculadora tributaria" title="Herramientas de cálculo" icon={Calculator} />
        <p className="mb-3 max-w-2xl text-sm sm:text-base" style={{ color: COLORS.textMuted }}>Cada cálculo se muestra paso a paso. En el examen real está permitida calculadora.</p>
        <div className="mb-6 sm:mb-8 max-w-2xl p-4 rounded-xl flex items-start gap-3" style={{ backgroundColor: COLORS.bgSoft, borderLeft: `3px solid ${COLORS.warning}` }}>
          <Lightbulb size={16} style={{ color: COLORS.warning }} className="shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm leading-relaxed" style={{ color: COLORS.text }}>
            <strong style={{ color: COLORS.warning }}>Recordatorio:</strong> El ITBI lo paga el vendedor. La base es el MAYOR entre precio de venta o catastral actualizado.
          </div>
        </div>
        <div className="space-y-px rounded-xl overflow-hidden" style={{ backgroundColor: COLORS.border }}>
          {tools.map(t => {
            const TIcon = t.icon;
            return (
              <button key={t.id} onClick={() => setTool(t.id)} className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 transition-all hover:opacity-95 active:scale-[0.99] group" style={{ backgroundColor: COLORS.bgCard }}>
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="flex items-center justify-center w-11 h-11 rounded-xl transition-transform group-hover:scale-110 shrink-0" style={{ backgroundColor: COLORS.bgSoft, border: `1px solid ${COLORS.border}` }}>
                    <TIcon size={18} style={{ color: COLORS.primary }} strokeWidth={1.8} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-base sm:text-lg leading-tight" style={{ color: COLORS.primary, fontFamily: STYLES.serif, fontWeight: 600 }}>{t.label}</div>
                    <div className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>{t.desc}</div>
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: COLORS.accent }} className="shrink-0 transition-transform group-hover:translate-x-1" />
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="cbr-fade-up">
      <BackBtn onClick={() => setTool(null)} label="Volver a calculadora" />
      {tool === 'catastral' && <CalcCatastral />}
      {tool === 'itbi' && <CalcITBI />}
      {tool === 'gc' && <CalcGC />}
      {tool === 'pft' && <CalcPFT />}
      {tool === 'completo' && <CalcCompleto />}
    </div>
  );
}

function InputBox({ label, value, onChange, type = "number", icon: Icon }) {
  return (
    <div className="mb-4">
      <label className="text-xs uppercase tracking-wider flex items-center gap-2 mb-2" style={{ color: COLORS.textMuted, fontWeight: 600 }}>
        {Icon && <Icon size={12} style={{ color: COLORS.accent }} />}
        {label}
      </label>
      <input type={type} inputMode="decimal" value={value} onChange={e => onChange(e.target.value)} className="w-full p-3 text-base font-mono rounded-lg focus:outline-none focus:ring-2" style={{ backgroundColor: COLORS.bgCard, border: `1px solid ${COLORS.border}`, color: COLORS.text }} />
    </div>
  );
}

function StepBox({ title, content, num }) {
  return (
    <div className="p-4 mb-3 rounded-lg flex gap-3" style={{ backgroundColor: COLORS.bgSoft, borderLeft: `3px solid ${COLORS.accent}` }}>
      {num && (
        <div className="flex items-center justify-center w-7 h-7 rounded-full shrink-0 text-xs font-semibold" style={{ backgroundColor: COLORS.accent, color: COLORS.bgCard }}>{num}</div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: COLORS.accent, fontWeight: 600 }}>{title}</div>
        <div className="text-sm font-mono break-words" style={{ color: COLORS.text }}>{content}</div>
      </div>
    </div>
  );
}

function ResultBox({ label, value, secondary }) {
  return (
    <div className="p-5 mt-4 rounded-xl" style={{ backgroundColor: COLORS.primary, color: COLORS.accent, boxShadow: `0 2px 8px ${COLORS.primary}30` }}>
      <div className="flex items-center gap-2 text-[10px] tracking-[0.3em] uppercase mb-1" style={{ fontWeight: 600 }}>
        {label}
      </div>
      <div className="text-2xl sm:text-3xl break-words" style={{ fontFamily: STYLES.serif, fontWeight: 600 }}>{value}</div>
      {secondary && <div className="text-xs mt-2" style={{ color: COLORS.bgCard }}>{secondary}</div>}
    </div>
  );
}

function CalcHeader({ icon: Icon, title, desc }) {
  return (
    <div className="mb-5 sm:mb-6">
      <div className="flex items-start gap-3 mb-3">
        <div className="flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-xl shrink-0" style={{ backgroundColor: COLORS.primary }}>
          <Icon size={20} style={{ color: COLORS.accent }} strokeWidth={1.8} />
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl leading-tight tracking-tight" style={{ color: COLORS.primary, fontFamily: STYLES.serif, fontWeight: 600 }}>{title}</h1>
      </div>
      <p className="text-sm" style={{ color: COLORS.textMuted }}>{desc}</p>
    </div>
  );
}

function CalcCatastral() {
  const [pc, setPc] = useState('150000');
  const [ac, setAc] = useState('2007');
  const [av, setAv] = useState('2022');
  const r = calcCatastralActualizado(parseFloat(pc) || 0, parseInt(ac) || 0, parseInt(av) || 0);
  return (
    <div>
      <CalcHeader icon={TrendingUp} title="Catastral actualizado" desc="Fórmula: Precio compra × (1 + (años transcurridos × 5%)). Los años se cuentan: año venta − año compra − 1." />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <InputBox label="Precio compra (B/.)" value={pc} onChange={setPc} icon={DollarSign} />
        <InputBox label="Año compra" value={ac} onChange={setAc} icon={Clock} />
        <InputBox label="Año venta" value={av} onChange={setAv} icon={Clock} />
      </div>
      <StepBox num="1" title="Años transcurridos" content={`${av} − ${ac} − 1 = ${r.anios} años`} />
      <StepBox num="2" title="Incremento" content={`${r.anios} × 5% = ${r.incremento}%`} />
      <StepBox num="3" title="Catastral actualizado" content={`${fmtCurrency(parseFloat(pc) || 0)} × ${(1 + r.incremento/100).toFixed(2)} = ${fmtCurrency(r.valor)}`} />
      <ResultBox label="Resultado" value={fmtCurrency(r.valor)} />
    </div>
  );
}

function CalcITBI() {
  const [pv, setPv] = useState('205000');
  const [ca, setCa] = useState('255000');
  const r = calcITBI(parseFloat(pv) || 0, parseFloat(ca) || 0);
  return (
    <div>
      <CalcHeader icon={Receipt} title="ITBI 2%" desc="Sobre el MAYOR entre precio de venta y catastral actualizado. Lo paga el vendedor." />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <InputBox label="Precio de venta (B/.)" value={pv} onChange={setPv} icon={DollarSign} />
        <InputBox label="Catastral actualizado (B/.)" value={ca} onChange={setCa} icon={TrendingUp} />
      </div>
      <StepBox num="1" title="Identificar el mayor" content={`Mayor entre ${fmtCurrency(parseFloat(pv)||0)} y ${fmtCurrency(parseFloat(ca)||0)} → ${r.fuente} = ${fmtCurrency(r.base)}`} />
      <StepBox num="2" title="Aplicar 2%" content={`${fmtCurrency(r.base)} × 0.02 = ${fmtCurrency(r.impuesto)}`} />
      <ResultBox label="ITBI a pagar" value={fmtCurrency(r.impuesto)} />
    </div>
  );
}

function CalcGC() {
  const [pc, setPc] = useState('150000');
  const [pv, setPv] = useState('205000');
  const r = calcGananciaCapital(parseFloat(pc) || 0, parseFloat(pv) || 0);
  return (
    <div>
      <CalcHeader icon={Percent} title="Ganancia de Capital" desc="Compara las dos opciones legales. Conviene la menor." />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <InputBox label="Precio compra (B/.)" value={pc} onChange={setPc} icon={DollarSign} />
        <InputBox label="Precio venta (B/.)" value={pv} onChange={setPv} icon={DollarSign} />
      </div>
      <StepBox num="·" title="Ganancia neta" content={`${fmtCurrency(parseFloat(pv)||0)} − ${fmtCurrency(parseFloat(pc)||0)} = ${fmtCurrency(r.ganancia)}`} />
      <StepBox num="A" title="Opción A — 10% sobre ganancia" content={`${fmtCurrency(r.ganancia)} × 10% = ${fmtCurrency(r.opcion10)}`} />
      <StepBox num="B" title="Opción B — 3% del precio de venta" content={`${fmtCurrency(parseFloat(pv)||0)} × 3% = ${fmtCurrency(r.opcion3)}`} />
      <ResultBox label="Conviene" value={fmtCurrency(r.montoConviene)} secondary={`${r.conviene} · ahorro: ${fmtCurrency(r.ahorro)}`} />
    </div>
  );
}

function CalcPFT() {
  const [vc, setVc] = useState('350000');
  const r = calcImpInmueblesPFT(parseFloat(vc) || 0);
  return (
    <div>
      <CalcHeader icon={Building2} title="Impuesto de Inmuebles PFT/VP" desc="Patrimonio Familiar Tributario o Vivienda Principal. Exento hasta B/.120,000; 0.5% hasta B/.700,000; 0.7% sobre exceso." />
      <InputBox label="Valor catastral (B/.)" value={vc} onChange={setVc} icon={TrendingUp} />
      {r.detalle.map((d, i) => <StepBox key={i} num={i+1} title={d.tramo} content={fmtCurrency(d.monto)} />)}
      <ResultBox label="Impuesto anual" value={fmtCurrency(r.impuesto)} />
    </div>
  );
}

function CalcCompleto() {
  const [pc, setPc] = useState('180000');
  const [ac, setAc] = useState('2016');
  const [pv, setPv] = useState('300000');
  const [av, setAv] = useState('2022');
  const [com, setCom] = useState('5');
  const cat = calcCatastralActualizado(parseFloat(pc) || 0, parseInt(ac) || 0, parseInt(av) || 0);
  const itbi = calcITBI(parseFloat(pv) || 0, cat.valor);
  const gc = calcGananciaCapital(parseFloat(pc) || 0, parseFloat(pv) || 0);
  const comision = (parseFloat(pv) || 0) * (parseFloat(com) || 0) / 100;
  const neto = (parseFloat(pv) || 0) - itbi.impuesto - gc.montoConviene - comision;
  return (
    <div>
      <CalcHeader icon={FlaskConical} title="Cálculo completo" desc="Catastral + ITBI + Ganancia Capital + comisión = neto al vendedor." />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <InputBox label="Precio compra (B/.)" value={pc} onChange={setPc} icon={DollarSign} />
        <InputBox label="Año compra" value={ac} onChange={setAc} icon={Clock} />
        <InputBox label="Precio venta (B/.)" value={pv} onChange={setPv} icon={DollarSign} />
        <InputBox label="Año venta" value={av} onChange={setAv} icon={Clock} />
        <InputBox label="Comisión CBR (%)" value={com} onChange={setCom} icon={Percent} />
      </div>
      <StepBox num="1" title="Catastral actualizado" content={`${cat.anios} años × 5% = ${cat.incremento}% → ${fmtCurrency(cat.valor)}`} />
      <StepBox num="2" title="ITBI (2% sobre el mayor)" content={`Base ${fmtCurrency(itbi.base)} (${itbi.fuente}) → ${fmtCurrency(itbi.impuesto)}`} />
      <StepBox num="3" title="Ganancia de Capital" content={`Conviene ${gc.conviene}: ${fmtCurrency(gc.montoConviene)}`} />
      <StepBox num="4" title="Comisión CBR" content={`${com}% × ${fmtCurrency(parseFloat(pv)||0)} = ${fmtCurrency(comision)}`} />
      <div className="p-5 mt-4 rounded-xl" style={{ backgroundColor: COLORS.primary, color: COLORS.accent, boxShadow: `0 2px 8px ${COLORS.primary}30` }}>
        <div className="flex items-center gap-2 text-[10px] tracking-[0.3em] uppercase mb-3" style={{ fontWeight: 600 }}>
          <FlaskConical size={11} /> Resumen vendedor
        </div>
        <div className="space-y-1.5 text-sm font-mono mb-3" style={{ color: COLORS.bgCard }}>
          <div className="flex justify-between gap-2"><span>Precio venta</span><span>{fmtCurrency(parseFloat(pv)||0)}</span></div>
          <div className="flex justify-between gap-2"><span>− ITBI</span><span>{fmtCurrency(itbi.impuesto)}</span></div>
          <div className="flex justify-between gap-2"><span>− Ganancia Capital</span><span>{fmtCurrency(gc.montoConviene)}</span></div>
          <div className="flex justify-between gap-2"><span>− Comisión CBR</span><span>{fmtCurrency(comision)}</span></div>
        </div>
        <div className="pt-3" style={{ borderTop: `1px solid ${COLORS.accent}` }}>
          <div className="text-[10px] tracking-[0.3em] uppercase mb-1" style={{ fontWeight: 600 }}>Neto al vendedor</div>
          <div className="text-2xl sm:text-3xl break-words" style={{ fontFamily: STYLES.serif, fontWeight: 600 }}>{fmtCurrency(neto)}</div>
        </div>
      </div>
    </div>
  );
}

function StatsView({ stats, examHistory, resetAll }) {
  const pct = stats.answered ? Math.round((stats.correct / stats.answered) * 100) : 0;
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  return (
    <div className="cbr-fade-up">
      <SectionHeader pre="Tu progreso" title="Estadísticas" icon={BarChart3} />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px mb-8 sm:mb-10 rounded-xl overflow-hidden" style={{ backgroundColor: COLORS.border }}>
        <StatCell label="Respondidas" value={`${stats.answered}/${stats.total}`} icon={ListChecks} />
        <StatCell label="Correctas" value={stats.correct} icon={Check} />
        <StatCell label="Acierto" value={`${pct}%`} accent icon={Target} />
        <StatCell label="Errores" value={stats.errorsCount} icon={AlertCircle} />
      </div>
      <div className="flex items-center gap-2 text-[10px] tracking-[0.3em] uppercase mb-4" style={{ color: COLORS.accent, fontWeight: 600 }}>
        <BookOpen size={12} /> Avance por bloque
      </div>
      <div className="space-y-px mb-8 sm:mb-10 rounded-xl overflow-hidden" style={{ backgroundColor: COLORS.border }}>
        {stats.byBlock.map(b => {
          const Icon = BLOCK_ICONS[b.id] || BookOpen;
          return (
            <div key={b.id} className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4" style={{ backgroundColor: COLORS.bgCard }}>
              <div className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0" style={{ backgroundColor: COLORS.bgSoft, border: `1px solid ${COLORS.border}` }}>
                <Icon size={15} style={{ color: COLORS.primary }} strokeWidth={1.8} />
              </div>
              <div className="text-base sm:text-lg w-8 sm:w-10 shrink-0" style={{ color: COLORS.accent, fontFamily: STYLES.serif, fontWeight: 600 }}>{String(b.id).padStart(2,'0')}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm leading-tight truncate" style={{ color: COLORS.primary, fontFamily: STYLES.serif, fontWeight: 600 }}>{b.full}</div>
                <div className="text-[11px]" style={{ color: COLORS.textMuted }}>{b.correct}/{b.total} correctas</div>
              </div>
              <div className="hidden sm:block w-24 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: COLORS.bgSoft }}>
                <div className="h-full" style={{ width: `${b.pct}%`, backgroundColor: COLORS.accent }} />
              </div>
              <div className="text-base sm:text-lg w-10 sm:w-12 text-right shrink-0" style={{ color: b.pct >= 71 ? COLORS.success : COLORS.primary, fontFamily: STYLES.serif, fontWeight: 600 }}>{b.pct}%</div>
            </div>
          );
        })}
      </div>
      {examHistory.length > 0 && (
        <>
          <div className="flex items-center gap-2 text-[10px] tracking-[0.3em] uppercase mb-4" style={{ color: COLORS.accent, fontWeight: 600 }}>
            <Trophy size={12} /> Historial de simulacros
          </div>
          <div className="space-y-px mb-8 sm:mb-10 rounded-xl overflow-hidden" style={{ backgroundColor: COLORS.border }}>
            {[...examHistory].reverse().map((h, i) => (
              <div key={i} className="p-3 sm:p-4 flex justify-between items-center gap-2" style={{ backgroundColor: COLORS.bgCard }}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0" style={{ backgroundColor: h.passed ? COLORS.successBg : COLORS.errorBg, border: `1px solid ${h.passed ? COLORS.success : COLORS.error}` }}>
                    {h.passed ? <Trophy size={14} style={{ color: COLORS.success }} /> : <Target size={14} style={{ color: COLORS.error }} />}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm truncate" style={{ color: COLORS.text }}>{new Date(h.date).toLocaleString('es-PA', { dateStyle: 'short', timeStyle: 'short' })}</div>
                    <div className="text-[11px]" style={{ color: COLORS.textMuted }}>{h.score} / {h.total} correctas</div>
                  </div>
                </div>
                <div className="text-xl sm:text-2xl shrink-0" style={{ color: h.passed ? COLORS.success : COLORS.error, fontFamily: STYLES.serif, fontWeight: 600 }}>{h.pct}%</div>
              </div>
            ))}
          </div>
        </>
      )}
      <SecondaryButton onClick={() => setShowResetConfirm(true)} icon={RotateCcw} danger>Reiniciar progreso</SecondaryButton>
      {showResetConfirm && (
        <div onClick={() => setShowResetConfirm(false)} className="fixed inset-0 z-50 flex items-center justify-center p-4 cbr-fade-up" style={{ backgroundColor: 'rgba(26,58,92,0.55)', backdropFilter: 'blur(4px)' }}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl p-6 sm:p-7" style={{ backgroundColor: COLORS.bgCard, boxShadow: `0 20px 60px ${COLORS.primary}40` }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl shrink-0" style={{ backgroundColor: COLORS.errorBg, border: `1px solid ${COLORS.error}` }}>
                <AlertCircle size={20} style={{ color: COLORS.error }} strokeWidth={1.8} />
              </div>
              <div>
                <div className="text-[10px] tracking-[0.3em] uppercase" style={{ color: COLORS.error, fontWeight: 600 }}>Acción definitiva</div>
                <h3 className="text-xl leading-tight" style={{ color: COLORS.primary, fontFamily: STYLES.serif, fontWeight: 700 }}>¿Reiniciar todo?</h3>
              </div>
            </div>
            <p className="text-sm mb-5" style={{ color: COLORS.text }}>Esto borra <strong style={{ color: COLORS.primary }}>todo</strong> tu progreso, errores e historial de simulacros. No se puede deshacer.</p>
            <div className="flex gap-2 justify-end">
              <SecondaryButton onClick={() => setShowResetConfirm(false)} size="sm">Cancelar</SecondaryButton>
              <SecondaryButton onClick={() => { setShowResetConfirm(false); resetAll(); }} icon={RotateCcw} danger size="sm">Sí, reiniciar</SecondaryButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
