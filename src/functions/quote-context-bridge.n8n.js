const context=$('Disponibilidade — validar todas datas').item.json;
const locality=$json.locality_result?.locality;
const socialSource={...context.pricing_source,
  url:'https://drive.google.com/file/d/1ZkoS54blFcWQxC66OTnHuI9ZBu_ErFmH/view',
  locality_id:locality?.localityId,tier_id:locality?.pricingTierId};
return {json:{...$json,_routing:context._routing,facts:context.facts,
  human_lock:context.human_lock,availability:context.availability,
  quote_result:$json.quote_result?{...$json.quote_result,
    pricing_source:$json.quote_result.pricing_source??socialSource,
    availability:context.availability}:null}};
