### Módulo: Catálogo Público
Este módulo disponibiliza os animais cadastrados para visualização pública, eliminando a necessidade de visita presencial apenas para conhecer as opções disponíveis. 
Resolve o principal gargalo de visibilidade e acesso à informação, aumentando em 60% a exposição dos animais. 
Serve a qualquer pessoa interessada em adotar, mesmo antes de criar conta.

#### Feature: Navegação e Listagem de Animais
Qualquer pessoa pode acessar o catálogo público sem necessidade de login. 
Os animais são exibidos em uma listagem de cards, contendo foto principal, nome, espécie, idade, porte e ONG responsável. 
A navegação é intuitiva e responsiva, permitindo acesso via desktop e mobile. 
Essa feature entrega acesso universal, democratizando a visibilidade dos animais e eliminando barreiras de entrada para potenciais adotantes.

#### Feature: Filtros de Busca
O catálogo público oferece filtros para refinar a busca: 
- espécie (todos/gato/cachorro) - (input tipo select);
- raça - (Quando selecionada uma espécie, o campo de raça só mostra as raças correspondentes a espécie. Se todos selecionado na espécie, todas as raças ficam disponíveis para seleção) - ({ 
    Cachorros: [
        "Vira-lata (SRD – sem raça definida)",
        "Labrador Retriever",
        "Golden Retriever",
        "Pastor Alemão",
        "Bulldog Francês",
        "Poodle",
        "Beagle",
        "Border Collie",
        "Shih Tzu",
        "Rottweiler",
        "Dachshund (salsicha)"]
    },{
    Gatos: [
        "Vira-lata (SRD – sem raça definida)",
        "Persa",
        "Maine Coon",
        "Siamês",
        "Ragdoll",
        "British Shorthair",
        "Sphynx (sem pelo)",
        "Bengal",
        "Angorá",
        "Munchkin"]
    }) - (input tipo select);
- idade - (input numérico);
- porte - (pequeno, médio, grande) - (input tipo select);
- sexo - (masculino,) - (input tipo select);
- temperamento (calmo, agressivo, misto) - (input tipo select);
- necessidades especiais - (input tipo switch);

Os filtros podem ser combinados para atender preferências específicas do adotante. 
Essa feature reduz o tempo de busca e melhora a experiência do usuário, aumentando a probabilidade de match entre animal e adotante.


Tela:
Barra de filtros: Logo abaixo há uma barra de busca com o texto "Busque por nome ou cidade" e cinco menus 
Grade de animais: O conteúdo principal exibe oito cards de animais disponíveis para adoção, organizados em duas linhas de quatro. Todos estão localizados em Campo Mourão - PR. Cada card tem uma foto, o nome do animal, a localização, uma etiqueta indicando se é cachorro ou gato, e tags com sexo, porte e idade, além de uma breve descrição:

Brisa – Cachorro, Fêmea, Médio, 7 meses – cãozinha dócil e brincalhona.
Théo – Gato, Macho, Pequeno, 7 anos – gatinho que adora sonecas e carinho.
Pietro – Gato, Macho, Pequeno, 2 anos – gatinho carinhoso de olhos curiosos.
Caju – Cachorro, Fêmea, Pequeno, 1 ano – energético e carinhoso.
Lua – Cachorro, Fêmea, Pequeno, 2 anos – alegre e sociável.
Teco – Cachorro, Macho, Pequeno, 7 meses – cheio de energia e sociável.
Zeca – Cachorro, Macho, Grande, 3 anos – protetor, inteligente e obediente.
Chico – Cachorro, Macho, Grande, 5 anos – robusto e tranquilo, gosta de passeios longos.

O design usa um fundo cinza claro, cards brancos com cantos arredondados e tags em tom lilás suave. É uma típica página de listagem de pets para adoção.