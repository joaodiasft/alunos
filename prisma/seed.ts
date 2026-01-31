import { PrismaClient } from "@prisma/client"
import { hashPassword } from "../src/lib/auth"

const prisma = new PrismaClient()

async function main() {
  const adminEmail = "redas@rmil.com"
  const adminPassword = "rmil"

  const admin = await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      nome: "Admin RMIL",
      senhaHash: await hashPassword(adminPassword),
    },
  })

  const anoLetivo = new Date().getFullYear()

  const turmasSeed = [
    { nome: "EX1 - Segunda 19h-22h", turno: "NOITE", tipo: "EXATAS" },
    { nome: "R1 - Terça 18h-19h30", turno: "NOITE", tipo: "REDACAO" },
    { nome: "R2 - Terça 19h30-21h", turno: "NOITE", tipo: "REDACAO" },
    { nome: "R3 - Sábado 07h-08h30", turno: "MANHA", tipo: "REDACAO" },
    { nome: "R4 - Sábado 08h30-10h", turno: "MANHA", tipo: "REDACAO" },
    { nome: "R5 - Sábado 10h-11h30", turno: "MANHA", tipo: "REDACAO" },
    { nome: "R6 - Sábado 11h30-13h", turno: "MANHA", tipo: "REDACAO" },
  ] as const

  const turmas = []
  for (const turmaSeed of turmasSeed) {
    const existente = await prisma.turma.findFirst({
      where: { nome: turmaSeed.nome },
      include: { planoFinanceiro: true },
    })
    if (existente) {
      turmas.push(existente)
      continue
    }
    const valorMatricula = 10000
    const valorMensalidade = turmaSeed.tipo === "EXATAS" ? 30000 : 25000
    const criada = await prisma.turma.create({
      data: {
        nome: turmaSeed.nome,
        anoLetivo,
        turno: turmaSeed.turno,
        modalidade: "PRESENCIAL",
        planoFinanceiro: {
          create: {
            valorMatricula,
            valorMensalidade,
          },
        },
      },
    })
    turmas.push(criada)
  }

  const disciplinaNomes = ["Redação", "Física", "Matemática", "Química"]
  const disciplinas = []
  for (const nome of disciplinaNomes) {
    const existente = await prisma.disciplina.findFirst({ where: { nome } })
    if (existente) {
      disciplinas.push(existente)
      continue
    }
    disciplinas.push(await prisma.disciplina.create({ data: { nome } }))
  }

  const professoresSeed = [
    { nome: "Prof. Martinha", email: "martinha@rmil.com" },
    { nome: "Prof. Adriano", email: "adriano@rmil.com" },
    { nome: "Prof. Bruno", email: "bruno@rmil.com" },
    { nome: "Prof. Marcos", email: "marcos@rmil.com" },
  ]
  const professores = []
  for (const prof of professoresSeed) {
    const existente = await prisma.professor.findFirst({ where: { nome: prof.nome } })
    if (existente) {
      professores.push(existente)
      continue
    }
    professores.push(
      await prisma.professor.create({
        data: {
          nome: prof.nome,
          email: prof.email,
          telefone: "11999999999",
        },
      })
    )
  }

  const aluno = await prisma.aluno.upsert({
    where: { token: "R001" },
    update: {},
    create: {
      nome: "Lucas Lima",
      dataNascimento: new Date("2010-05-12"),
      telefone: "11988887777",
      token: "R001",
      status: "ATIVO",
      turmas: {
        create: [
          { turmaId: turmas[0].id, inicioEm: new Date() },
          { turmaId: turmas[1].id, inicioEm: new Date() },
        ],
      },
    },
  })

  const bolsaExistente = await prisma.bolsaDesconto.findFirst({
    where: { alunoId: aluno.id },
  })

  if (!bolsaExistente) {
    await prisma.bolsaDesconto.create({
      data: {
        alunoId: aluno.id,
        tipo: "Bolsa",
        percentual: 50,
      },
    })
  }

  const responsavelExistente = await prisma.responsavel.findFirst({
    where: { telefone: "11977776666" },
  })

  if (!responsavelExistente) {
    await prisma.responsavel.create({
      data: {
        nome: "Marina Lima",
        telefone: "11977776666",
        alunos: {
          create: {
            alunoId: aluno.id,
          },
        },
      },
    })
  }

  function nextWeekday(target: number, hour: number, minute: number) {
    const now = new Date()
    const day = now.getDay()
    const diff = (target + 7 - day) % 7 || 7
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff, hour, minute, 0)
  }

  const aulasSeed = [
    {
      turmaNome: "EX1 - Segunda 19h-22h",
      disciplina: "Física",
      professor: "Prof. Adriano",
      date: nextWeekday(1, 19, 0),
    },
    {
      turmaNome: "EX1 - Segunda 19h-22h",
      disciplina: "Matemática",
      professor: "Prof. Bruno",
      date: nextWeekday(1, 20, 0),
    },
    {
      turmaNome: "EX1 - Segunda 19h-22h",
      disciplina: "Química",
      professor: "Prof. Marcos",
      date: nextWeekday(1, 21, 0),
    },
    {
      turmaNome: "R1 - Terça 18h-19h30",
      disciplina: "Redação",
      professor: "Prof. Martinha",
      date: nextWeekday(2, 18, 0),
    },
    {
      turmaNome: "R2 - Terça 19h30-21h",
      disciplina: "Redação",
      professor: "Prof. Martinha",
      date: nextWeekday(2, 19, 30),
    },
    {
      turmaNome: "R3 - Sábado 07h-08h30",
      disciplina: "Redação",
      professor: "Prof. Martinha",
      date: nextWeekday(6, 7, 0),
    },
  ]

  for (const aula of aulasSeed) {
    const turma = turmas.find((item) => item.nome === aula.turmaNome)
    const disciplina = disciplinas.find((item) => item.nome === aula.disciplina)
    const professor = professores.find((item) => item.nome === aula.professor)
    if (!turma || !disciplina || !professor) continue
    await prisma.aula.create({
      data: {
        turmaId: turma.id,
        data: aula.date,
        disciplinaId: disciplina.id,
        professorId: professor.id,
        tema: "Aula",
      },
    })
  }

  const referencia = `${anoLetivo}-${String(new Date().getMonth() + 1).padStart(2, "0")}`
  const vencimento = new Date(anoLetivo, new Date().getMonth(), 10)
  for (const turma of turmas.slice(0, 2)) {
    const createData = {
      id: `${referencia}-${aluno.id}-${turma.id}`,
      alunoId: aluno.id,
      turmaId: turma.id,
      referencia,
      valorOriginal: 85000,
      desconto: 0,
      valorFinal: 85000,
      vencimento,
      status: "PENDENTE",
      aprovacao: "PENDENTE",
    } as any

    await prisma.mensalidade.upsert({
      where: { id: `${referencia}-${aluno.id}-${turma.id}` },
      update: {},
      create: createData,
    })
  }

  await prisma.logSistema.create({
    data: {
      adminId: admin.id,
      acao: "SEED",
      entidade: "Sistema",
      depois: "Dados iniciais carregados",
    },
  })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
