/**
 * Seed data for the mock backend. Times are relative to server start so the
 * feed always reads "há 1 h", "há 2 h" and so on.
 */
import type {
	Conversation,
	Favorite,
	Listing,
	Photo,
	SavedSearch,
	User
} from '$lib/api/schemas';

const now = Date.now();
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
export const ago = (ms: number) => new Date(now - ms).toISOString();
export const ahead = (ms: number) => new Date(now + ms).toISOString();
const R = (reais: number) => Math.round(reais * 100);

export const VIEWER_ID = 'carlos';

export const users: User[] = [
	{ id: 'carlos', name: 'Carlos', handle: 'carlos', rating: 5, salesCount: 3, neighborhood: 'Pinheiros', responseTime: '~1 h', verified: true },
	{ id: 'marina', name: 'Marina', handle: 'marina.pedala', rating: 4.9, salesCount: 212, neighborhood: 'Pinheiros', responseTime: '~15 min', verified: true },
	{ id: 'paulo', name: 'Paulo', handle: 'paulo.sp', rating: 5, salesCount: 37, neighborhood: 'Jardim Paulistano', responseTime: '~30 min', verified: true },
	{ id: 'julia', name: 'Julia', handle: 'julia.m', rating: 4.8, salesCount: 54, neighborhood: 'Vila Madalena', responseTime: '~20 min', verified: true },
	{ id: 'ana', name: 'Ana', handle: 'ana.desapega', rating: 4.9, salesCount: 88, neighborhood: 'Perdizes', responseTime: '~1 h', verified: true },
	{ id: 'rafa', name: 'Rafa', handle: 'rafa.bikes', rating: 4.7, salesCount: 19, neighborhood: 'Butantã', responseTime: '~2 h', verified: false },
	{ id: 'nina', name: 'Nina', handle: 'nina.casa', rating: 4.9, salesCount: 63, neighborhood: 'Sumaré', responseTime: '~40 min', verified: true },
	{ id: 'beto', name: 'Beto', handle: 'beto.vinil', rating: 4.6, salesCount: 12, neighborhood: 'Pinheiros', responseTime: '~3 h', verified: false },
	{ id: 'leo', name: 'Léo', handle: 'leo.tech', rating: 4.8, salesCount: 41, neighborhood: 'Lapa', responseTime: '~1 h', verified: true },
	{ id: 'lucas', name: 'Lucas', handle: 'lucas.r', rating: 4.5, salesCount: 2, neighborhood: 'Pinheiros', responseTime: '~1 h', verified: false },
	{ id: 'lu', name: 'Lu', handle: 'brecho.da.lu', rating: 4.9, salesCount: 640, neighborhood: 'Bela Vista', responseTime: '~10 min', verified: true }
];

const photo = (alt: string, note?: string): Photo => ({ src: null, alt, ...(note ? { note } : {}) });
const img = (file: string, alt: string, note?: string): Photo => ({
	src: `/images/${file}.jpg`,
	alt,
	...(note ? { note } : {})
});

type Seed = Omit<Listing, 'comments' | 'specs' | 'tags' | 'subcategoryPath' | 'hasInvoice' | 'acceptsOffers' | 'status' | 'fairPrice' | 'description'> &
	Partial<Listing>;

function listing(seed: Seed): Listing {
	return {
		description: '',
		comments: [],
		specs: [],
		tags: [],
		subcategoryPath: [],
		hasInvoice: false,
		acceptsOffers: true,
		status: 'available',
		fairPrice: null,
		...seed
	};
}

const shipping = (deliveryReais: number | null, eta: string | null, pickupKm: number | null) => ({
	deliveryPrice: deliveryReais === null ? null : R(deliveryReais),
	deliveryEta: eta,
	pickupSpotKm: pickupKm
});

const marinaAccessory = (id: string, title: string, price: number, mins: number): Listing =>
	listing({
		id,
		sellerId: 'marina',
		title,
		category: 'esportes',
		subcategoryPath: ['Esportes', 'Ciclismo', 'Acessórios'],
		condition: 'muito_bom',
		price: R(price),
		photos: [photo(title)],
		postedAt: ago(mins * MIN),
		distanceKm: 2.1,
		neighborhood: 'Pinheiros',
		shipping: shipping(18, 'chega sáb, 3/10', 1.8)
	});

export const listings: Listing[] = [
	listing({
		id: 'bike-amarela',
		sellerId: 'marina',
		title: 'Bicicleta aro 26 com cestinha',
		description:
			'Vou me mudar. Revisada mês passado, pneus novos. Aceito oferta razoável! Acompanha cestinha, bagageiro e cadeado. Usada só nos fins de semana, sempre guardada em garagem coberta.',
		category: 'esportes',
		subcategoryPath: ['Esportes', 'Ciclismo', 'Bicicletas'],
		condition: 'muito_bom',
		price: R(650),
		photos: [
			img('bike-yellow', 'Bicicleta amarela com cestinha'),
			img('bike-lilac', 'Lateral da bicicleta com bagageiro'),
			img('bike-purple', 'Detalhe do garfo', 'Marca de uso: risco no garfo'),
			img('bike-black', 'Bicicleta vista de trás')
		],
		tags: ['Aro 26', 'Cestinha e bagageiro'],
		specs: [
			{ label: 'Quadro', value: 'Alumínio, 17' },
			{ label: 'Freio', value: 'Disco mecânico' },
			{ label: 'Uso', value: 'Fins de semana' },
			{ label: 'Pneus', value: 'Trocados' }
		],
		postedAt: ago(1 * HOUR),
		distanceKm: 2.1,
		neighborhood: 'Pinheiros',
		shipping: shipping(42, 'chega sáb, 3/10', 1.8),
		hasInvoice: true,
		fairPrice: { min: R(450), max: R(850) },
		comments: [
			{ id: 'c1', authorId: 'lucas', text: 'Ainda disponível? Dá pra ver no sábado?', createdAt: ago(40 * MIN) },
			{ id: 'c2', authorId: 'marina', text: 'Sim! Sábado de manhã fica ótimo.', createdAt: ago(32 * MIN), replyTo: 'c1' },
			{ id: 'c3', authorId: 'ana', text: 'Cabe uma cadeirinha infantil no bagageiro?', createdAt: ago(20 * MIN) }
		]
	}),
	listing({
		id: 'jaqueta-couro',
		sellerId: 'paulo',
		title: 'Jaqueta de couro marrom, tam. M',
		description: 'Ganhei de presente e ficou grande. Nunca usei, com etiqueta.',
		category: 'moda',
		subcategoryPath: ['Moda', 'Masculino', 'Jaquetas'],
		condition: 'novo',
		price: R(180),
		photos: [
			photo('Jaqueta de couro marrom, frente'),
			photo('Jaqueta de couro marrom, costas'),
			photo('Etiqueta da jaqueta'),
			photo('Detalhe do zíper')
		],
		tags: ['Tam. M'],
		specs: [
			{ label: 'Tamanho', value: 'M' },
			{ label: 'Manga', value: '62 cm' },
			{ label: 'Material', value: 'Couro legítimo' }
		],
		postedAt: ago(2 * HOUR),
		distanceKm: 1.4,
		neighborhood: 'Jardim Paulistano',
		shipping: shipping(22, 'chega sex, 2/10', 1.1),
		hasInvoice: true,
		fairPrice: { min: R(150), max: R(320) },
		comments: [
			{ id: 'c4', authorId: 'ana', text: 'Qual o comprimento da manga?', createdAt: ago(60 * MIN) },
			{ id: 'c5', authorId: 'paulo', text: '62 cm, do ombro ao punho.', createdAt: ago(50 * MIN), replyTo: 'c4' }
		]
	}),
	listing({
		id: 'sofa-verde',
		sellerId: 'nina',
		title: 'Sofá 3 lugares verde',
		description: 'Sofá de veludo verde, 2,10 m. Sem manchas, casa sem pets. Retirada no térreo.',
		category: 'casa',
		subcategoryPath: ['Casa', 'Móveis', 'Sofás'],
		condition: 'bom',
		price: R(480),
		photos: [photo('Sofá verde de três lugares')],
		tags: ['2,10 m', 'Veludo'],
		specs: [{ label: 'Largura', value: '2,10 m' }],
		postedAt: ago(3 * HOUR),
		distanceKm: 3,
		neighborhood: 'Sumaré',
		shipping: shipping(null, null, 0),
		fairPrice: { min: R(400), max: R(900) }
	}),
	listing({
		id: 'bike-lilas',
		sellerId: 'julia',
		title: 'Bicicleta lilás aro 26',
		description: 'Bicicleta feminina com cestinha. Câmbio de 6 marchas regulado.',
		category: 'esportes',
		subcategoryPath: ['Esportes', 'Ciclismo', 'Bicicletas'],
		condition: 'muito_bom',
		price: R(520),
		photos: [img('bike-lilac', 'Bicicleta lilás com cestinha')],
		tags: ['Aro 26', '6 marchas'],
		postedAt: ago(5 * HOUR),
		distanceKm: 3.4,
		neighborhood: 'Vila Madalena',
		shipping: shipping(42, 'chega sáb, 3/10', 2),
		fairPrice: { min: R(450), max: R(850) }
	}),
	listing({
		id: 'luminaria',
		sellerId: 'nina',
		title: 'Luminária de chão',
		description: 'Luminária de piso com cúpula de linho. Lâmpada E27 inclusa.',
		category: 'casa',
		subcategoryPath: ['Casa', 'Decoração', 'Iluminação'],
		condition: 'como_novo',
		price: R(90),
		photos: [photo('Luminária de chão com cúpula de linho')],
		postedAt: ago(6 * HOUR),
		distanceKm: 3,
		neighborhood: 'Sumaré',
		shipping: shipping(25, 'chega sáb, 3/10', 0)
	}),
	listing({
		id: 'bike-roxa',
		sellerId: 'rafa',
		title: 'Bicicleta roxa com bagageiro',
		description: 'Aro 26, bagageiro traseiro e cestinha. Pneus calibrados.',
		category: 'esportes',
		subcategoryPath: ['Esportes', 'Ciclismo', 'Bicicletas'],
		condition: 'bom',
		price: R(590),
		photos: [img('bike-purple', 'Bicicleta roxa com bagageiro')],
		tags: ['Aro 26'],
		postedAt: ago(8 * HOUR),
		distanceKm: 4.8,
		neighborhood: 'Butantã',
		shipping: shipping(42, 'chega seg, 5/10', 3),
		fairPrice: { min: R(450), max: R(850) },
		comments: [
			{ id: 'c6', authorId: 'lucas', text: 'Faz por 500?', createdAt: ago(3 * HOUR) },
			{ id: 'c7', authorId: 'rafa', text: 'Faço 560 com retirada.', createdAt: ago(2 * HOUR), replyTo: 'c6' }
		]
	}),
	listing({
		id: 'carrinho-conforto',
		sellerId: 'julia',
		title: 'Carrinho com bebê-conforto',
		description: 'Travel system com bebê-conforto. Fecha com uma mão, tenho vídeo mostrando.',
		category: 'bebe',
		subcategoryPath: ['Bebê', 'Passeio', 'Carrinhos'],
		condition: 'muito_bom',
		price: R(380),
		photos: [photo('Carrinho com bebê-conforto')],
		tags: ['6,8 kg', 'Fecha com 1 mão'],
		specs: [
			{ label: 'Peso', value: '6,8 kg' },
			{ label: 'Fechamento', value: 'uma mão' }
		],
		postedAt: ago(10 * HOUR),
		distanceKm: 4.5,
		neighborhood: 'Vila Madalena',
		shipping: shipping(35, 'chega sáb, 3/10', 2.2)
	}),
	listing({
		id: 'carrinho-viagem',
		sellerId: 'paulo',
		title: 'Carrinho compacto de viagem',
		description: 'Fecha com uma mão e cabe em mala de avião. Retirada hoje.',
		category: 'bebe',
		subcategoryPath: ['Bebê', 'Passeio', 'Carrinhos'],
		condition: 'como_novo',
		price: R(350),
		photos: [photo('Carrinho compacto de viagem')],
		tags: ['5,9 kg', 'Fecha com 1 mão'],
		specs: [
			{ label: 'Peso', value: '5,9 kg' },
			{ label: 'Fechamento', value: 'uma mão' }
		],
		postedAt: ago(12 * HOUR),
		distanceKm: 1.9,
		neighborhood: 'Jardim Paulistano',
		shipping: shipping(28, 'chega sex, 2/10', 1)
	}),
	listing({
		id: 'carrinho-reversivel',
		sellerId: 'ana',
		title: 'Carrinho reversível com capota',
		description: 'Capota grande e encosto reclinável. Aceito oferta.',
		category: 'bebe',
		subcategoryPath: ['Bebê', 'Passeio', 'Carrinhos'],
		condition: 'bom',
		price: R(400),
		photos: [photo('Carrinho reversível com capota')],
		tags: ['7,5 kg', 'Fecha com 1 mão'],
		specs: [
			{ label: 'Peso', value: '7,5 kg' },
			{ label: 'Fechamento', value: 'uma mão' }
		],
		postedAt: ago(14 * HOUR),
		distanceKm: 3.7,
		neighborhood: 'Perdizes',
		shipping: shipping(35, 'chega sáb, 3/10', 2.5)
	}),
	listing({
		id: 'carrinho-duplo',
		sellerId: 'rafa',
		title: 'Carrinho duplo para gêmeos',
		description: 'Carrinho lado a lado, ótimo estado.',
		category: 'bebe',
		subcategoryPath: ['Bebê', 'Passeio', 'Carrinhos'],
		condition: 'bom',
		price: R(390),
		photos: [photo('Carrinho duplo')],
		specs: [
			{ label: 'Peso', value: '11 kg' },
			{ label: 'Fechamento', value: 'duas mãos' }
		],
		postedAt: ago(20 * HOUR),
		distanceKm: 4.8,
		neighborhood: 'Butantã',
		shipping: shipping(null, null, 3)
	}),
	listing({
		id: 'carrinho-classico',
		sellerId: 'nina',
		title: 'Carrinho clássico com moisés',
		description: 'Inclui moisés e capa de chuva.',
		category: 'bebe',
		subcategoryPath: ['Bebê', 'Passeio', 'Carrinhos'],
		condition: 'muito_bom',
		price: R(300),
		photos: [photo('Carrinho clássico com moisés')],
		specs: [
			{ label: 'Peso', value: '9,2 kg' },
			{ label: 'Fechamento', value: 'uma mão' }
		],
		postedAt: ago(26 * HOUR),
		distanceKm: 3,
		neighborhood: 'Sumaré',
		shipping: shipping(40, 'chega seg, 5/10', 0)
	}),
	listing({
		id: 'carrinho-passeio',
		sellerId: 'beto',
		title: 'Carrinho de passeio guarda-chuva',
		description: 'Leve, mas fecha com as duas mãos.',
		category: 'bebe',
		subcategoryPath: ['Bebê', 'Passeio', 'Carrinhos'],
		condition: 'bom',
		price: R(250),
		photos: [photo('Carrinho guarda-chuva')],
		specs: [
			{ label: 'Peso', value: '5,1 kg' },
			{ label: 'Fechamento', value: 'duas mãos' }
		],
		postedAt: ago(30 * HOUR),
		distanceKm: 1.2,
		neighborhood: 'Pinheiros',
		shipping: shipping(25, 'chega sex, 2/10', 0.5)
	}),
	listing({
		id: 'bike-preta',
		sellerId: 'beto',
		title: 'Bicicleta preta clássica',
		description: 'Modelo clássico com cestinha.',
		category: 'esportes',
		subcategoryPath: ['Esportes', 'Ciclismo', 'Bicicletas'],
		condition: 'muito_bom',
		price: R(700),
		photos: [img('bike-black', 'Bicicleta preta clássica')],
		postedAt: ago(3 * DAY),
		distanceKm: 1.2,
		neighborhood: 'Pinheiros',
		shipping: shipping(42, null, 0.5),
		status: 'sold'
	}),
	listing({
		id: 'monitor-27',
		sellerId: 'leo',
		title: 'Monitor 27 polegadas',
		description: 'QHD, 144 Hz, sem pixels mortos.',
		category: 'eletronicos',
		subcategoryPath: ['Eletrônicos', 'Informática', 'Monitores'],
		condition: 'como_novo',
		price: R(980),
		photos: [photo('Monitor de 27 polegadas')],
		postedAt: ago(4 * DAY),
		distanceKm: 6,
		neighborhood: 'Lapa',
		shipping: shipping(55, null, 4),
		status: 'sold'
	}),
	listing({
		id: 'fone-bt',
		sellerId: 'leo',
		title: 'Fone bluetooth com cancelamento de ruído',
		description: 'Bateria dura 30 h. Acompanha estojo e cabo.',
		category: 'eletronicos',
		subcategoryPath: ['Eletrônicos', 'Áudio', 'Fones'],
		condition: 'muito_bom',
		price: R(420),
		photos: [photo('Fone bluetooth preto')],
		tags: ['Com estojo'],
		postedAt: ago(18 * HOUR),
		distanceKm: 6,
		neighborhood: 'Lapa',
		shipping: shipping(20, 'chega sex, 2/10', 4),
		fairPrice: { min: R(350), max: R(600) }
	}),
	listing({
		id: 'mesa-madeira',
		sellerId: 'rafa',
		title: 'Mesa pequena de madeira',
		description: 'Mesa de canto em madeira maciça, 60 x 60 cm.',
		category: 'casa',
		subcategoryPath: ['Casa', 'Móveis', 'Mesas'],
		condition: 'bom',
		price: R(150),
		photos: [photo('Mesa pequena de madeira')],
		postedAt: ago(22 * HOUR),
		distanceKm: 4.8,
		neighborhood: 'Butantã',
		shipping: shipping(38, 'chega seg, 5/10', 3)
	}),
	listing({
		id: 'vinil-clube',
		sellerId: 'beto',
		title: 'Vinil Clube da Esquina, 1972',
		description: 'Prensagem original, capa dupla. Disco sem riscos.',
		category: 'lazer',
		subcategoryPath: ['Lazer', 'Música', 'Vinil'],
		condition: 'bom',
		price: R(260),
		photos: [photo('Capa do vinil Clube da Esquina')],
		postedAt: ago(9 * HOUR),
		distanceKm: 1.2,
		neighborhood: 'Pinheiros',
		shipping: shipping(18, 'chega sex, 2/10', 0.5)
	}),
	listing({
		id: 'jaqueta-90',
		sellerId: 'lu',
		title: 'Jaqueta de couro marrom, anos 90',
		description: 'Peça vintage original, forro em bom estado.',
		category: 'moda',
		subcategoryPath: ['Moda', 'Vintage', 'Jaquetas'],
		condition: 'bom',
		price: R(180),
		photos: [photo('Jaqueta de couro marrom anos 90')],
		tags: ['Tam. M'],
		postedAt: ago(4 * HOUR),
		distanceKm: 7,
		neighborhood: 'Bela Vista',
		shipping: shipping(22, 'chega sex, 2/10', null)
	}),
	listing({
		id: 'vestido-floral',
		sellerId: 'lu',
		title: 'Vestido midi floral, anos 70',
		description: 'Tecido leve, botões originais.',
		category: 'moda',
		subcategoryPath: ['Moda', 'Vintage', 'Vestidos'],
		condition: 'muito_bom',
		price: R(95),
		photos: [photo('Vestido midi floral')],
		tags: ['Tam. P'],
		postedAt: ago(7 * HOUR),
		distanceKm: 7,
		neighborhood: 'Bela Vista',
		shipping: shipping(18, 'chega sex, 2/10', null)
	}),
	listing({
		id: 'camisa-seda',
		sellerId: 'lu',
		title: 'Camisa de seda estampada',
		description: 'Estampa geométrica, caimento solto.',
		category: 'moda',
		subcategoryPath: ['Moda', 'Vintage', 'Camisas'],
		condition: 'como_novo',
		price: R(70),
		photos: [photo('Camisa de seda estampada')],
		tags: ['Tam. G'],
		postedAt: ago(11 * HOUR),
		distanceKm: 7,
		neighborhood: 'Bela Vista',
		shipping: shipping(18, 'chega sex, 2/10', null)
	}),
	listing({
		id: 'tenis-retro',
		sellerId: 'lu',
		title: 'Tênis retrô de corrida, nº 40',
		description: 'Solado inteiro, cadarço novo.',
		category: 'moda',
		subcategoryPath: ['Moda', 'Vintage', 'Calçados'],
		condition: 'bom',
		price: R(160),
		photos: [photo('Tênis retrô de corrida')],
		tags: ['Nº 40'],
		postedAt: ago(15 * HOUR),
		distanceKm: 7,
		neighborhood: 'Bela Vista',
		shipping: shipping(24, 'chega sáb, 3/10', null)
	}),
	marinaAccessory('capacete', 'Capacete ciclismo, tam. M', 120, 300),
	marinaAccessory('bomba-pe', 'Bomba de pé com manômetro', 60, 320),
	marinaAccessory('sapatilha', 'Sapatilha clip nº 39', 180, 340),
	marinaAccessory('rolo-treino', 'Rolo de treino magnético', 450, 360),
	marinaAccessory('bolsa-quadro', 'Bolsa de quadro impermeável', 45, 380),
	marinaAccessory('luzes-led', 'Luzes LED dianteira + traseira', 55, 400)
];

export const favorites: Favorite[] = [
	{ listingId: 'bike-amarela', addedAt: ago(30 * MIN), badge: { kind: 'offer_sent', amount: R(580) } },
	{ listingId: 'bike-lilas', addedAt: ago(2 * HOUR), badge: { kind: 'price_drop', amount: R(80) } },
	{ listingId: 'jaqueta-couro', addedAt: ago(3 * HOUR), badge: { kind: 'new_tag' } },
	{ listingId: 'bike-roxa', addedAt: ago(5 * HOUR), badge: { kind: 'new_comments', count: 2 } },
	{ listingId: 'sofa-verde', addedAt: ago(8 * HOUR), badge: { kind: 'price_drop', amount: R(120) } },
	{ listingId: 'bike-preta', addedAt: ago(1 * DAY), badge: { kind: 'sold' } },
	{ listingId: 'luminaria', addedAt: ago(1 * DAY + HOUR), badge: { kind: 'available' } },
	{ listingId: 'monitor-27', addedAt: ago(2 * DAY), badge: { kind: 'sold' } },
	{ listingId: 'carrinho-viagem', addedAt: ago(2 * DAY + HOUR), badge: { kind: 'available' } },
	{ listingId: 'mesa-madeira', addedAt: ago(3 * DAY), badge: { kind: 'available' } },
	{ listingId: 'vinil-clube', addedAt: ago(4 * DAY), badge: { kind: 'available' } },
	{ listingId: 'capacete', addedAt: ago(5 * DAY), badge: { kind: 'available' } }
];

export const conversations: Conversation[] = [
	{
		id: 'conv-marina',
		listingId: 'bike-amarela',
		buyerId: VIEWER_ID,
		sellerId: 'marina',
		unread: 1,
		messages: [
			{ kind: 'text', id: 'm1', authorId: VIEWER_ID, text: 'Oi! Ainda está disponível? Os pneus são originais?', createdAt: ago(50 * MIN) },
			{ kind: 'text', id: 'm2', authorId: 'marina', text: 'Está sim! Troquei os pneus há poucos meses, tem foto na galeria.', createdAt: ago(45 * MIN) },
			{ kind: 'offer', id: 'm3', authorId: VIEWER_ID, amount: R(580), status: 'countered', createdAt: ago(30 * MIN), expiresAt: ahead(23 * HOUR) },
			{ kind: 'offer', id: 'm4', authorId: 'marina', amount: R(620), status: 'pending', createdAt: ago(10 * MIN), expiresAt: ahead(24 * HOUR) }
		]
	},
	{
		id: 'conv-paulo',
		listingId: 'jaqueta-couro',
		buyerId: VIEWER_ID,
		sellerId: 'paulo',
		unread: 1,
		messages: [
			{ kind: 'text', id: 'm5', authorId: VIEWER_ID, text: 'Dá pra retirar amanhã à noite?', createdAt: ago(3 * HOUR) },
			{ kind: 'text', id: 'm6', authorId: 'paulo', text: 'Dá sim, depois das 19 h.', createdAt: ago(2 * HOUR) }
		]
	},
	{
		id: 'conv-julia',
		listingId: 'carrinho-conforto',
		buyerId: VIEWER_ID,
		sellerId: 'julia',
		unread: 1,
		messages: [
			{ kind: 'text', id: 'm7', authorId: VIEWER_ID, text: 'Pode mandar o vídeo fechando com uma mão?', createdAt: ago(6 * HOUR) },
			{ kind: 'text', id: 'm8', authorId: 'julia', text: 'Mando já! Ele pesa 6,8 kg.', createdAt: ago(5 * HOUR) }
		]
	}
];

export const savedSearches: SavedSearch[] = [
	{ id: 's1', label: 'Carrinho de bebê leve', newCount: 2 },
	{ id: 's2', label: 'Presente pra quem curte vinil', newCount: 0 },
	{ id: 's3', label: 'Mesa pequena de madeira', newCount: 0 }
];
