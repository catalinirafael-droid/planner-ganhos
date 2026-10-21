// Consulta pública ao MediaWiki. Não reproduz o banco inteiro nem importa preços de Market.
const wikiBase='https://www.tibiawiki.com.br';
const wikiInput=document.getElementById('wikiquery');
const wikiStatus=document.getElementById('wikistatus');
const wikiResults=document.getElementById('wikiresults');
const escapeHtml=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function searchWiki(){
 const q=wikiInput.value.trim();if(!q){wikiStatus.textContent='Digite o nome do item.';return;}
 wikiStatus.textContent='Consultando TibiaWiki BR...';wikiResults.replaceChildren();
 const endpoint=wikiBase+'/api.php?action=query&generator=search&gsrnamespace=0&gsrlimit=12&gsrsearch='+encodeURIComponent(q)+'&prop=info&inprop=url&format=json&origin=*';
 try{
  const resp=await fetch(endpoint,{method:'GET',mode:'cors'});
  if(!resp.ok)throw new Error('HTTP '+resp.status);
  const data=await resp.json();
  const pages=Object.values(data?.query?.pages||{}).sort((a,b)=>(a.index||0)-(b.index||0));
  if(!pages.length){wikiStatus.textContent='Nenhum item encontrado.';return;}
  wikiStatus.textContent=pages.length+' resultados encontrados. Confira os detalhes na wiki.';
  for(const page of pages){
    const p=document.createElement('p'),a=document.createElement('a');
    a.href=page.fullurl||wikiBase+'/wiki/'+encodeURIComponent(page.title.replaceAll(' ','_'));a.target='_blank';a.rel='noopener noreferrer';a.textContent=page.title;
    p.appendChild(a);wikiResults.appendChild(p);
  }
 }catch(err){
  wikiStatus.textContent='Consulta automática indisponível neste navegador. Abra a busca no site:';
  const a=document.createElement('a');a.href=wikiBase+'/index.php?search='+encodeURIComponent(q);a.target='_blank';a.rel='noopener noreferrer';a.textContent='Pesquisar '+q+' na TibiaWiki BR';wikiResults.appendChild(a);
 }
}
document.getElementById('wikisearch').addEventListener('click',searchWiki);
wikiInput.addEventListener('keydown',e=>{if(e.key==='Enter')searchWiki()});
