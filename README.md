# JuntaPDF

Aplicação web para juntar vários ficheiros PDF num único documento. A leitura e a união dos ficheiros acontecem no navegador, no dispositivo do utilizador.

## Funcionalidades

- Adicionar vários PDFs por seleção ou arrastar e largar.
- Reordenar ficheiros, remover um ficheiro ou limpar a lista.
- Escolher o nome do ficheiro final.
- Descarregar o PDF unido diretamente para o dispositivo.
- Compatível com computador e telemóvel.

## Privacidade

Os documentos não são enviados para um servidor. A biblioteca PDF usada pela aplicação é carregada com a aplicação e o processamento decorre localmente no navegador. PDFs protegidos por palavra-passe não são suportados.

## Executar localmente

Requer Node.js 20 ou superior.

```sh
npm install
npm run dev
```

## Publicar no Vercel

Importe este repositório no Vercel. O ficheiro `vercel.json` configura a instalação, a compilação através de `npm run build` e a pasta de saída `dist`.

O projeto já inclui a conta Google AdSense e o Vercel Analytics usados no Transcreve AI. O domínio deve ser adicionado e aprovado no AdSense para os anúncios aparecerem.
