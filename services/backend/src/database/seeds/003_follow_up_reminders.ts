import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  const existingReminders = await knex('follow_up_reminders').first();
  if (existingReminders) {
    console.log('[Seed] Follow-up reminders já existem. Pulando.');
    return;
  }

  let completedAdoptions = await knex('adoption_requests')
    .where({ status: 'completed' })
    .select('id', 'ong_id', 'completed_at');

  if (completedAdoptions.length === 0) {
    console.log('[Seed] Nenhuma adoção completed encontrada. Criando adoções de exemplo...');

    const animal = await knex('animals').first();
    if (!animal) {
      console.log('[Seed] Nenhum animal encontrado. Abortando.');
      return;
    }

    const adopter = await knex('users').where({ role: 'adopter' }).first();
    if (!adopter) {
      console.log('[Seed] Nenhum adotante encontrado. Abortando.');
      return;
    }

    const ongId = animal.ong_id;

    const seedAdoptions = [
      {
        id: 'a0a00001-0001-4001-a001-000000000001',
        animal_id: animal.id,
        adopter_id: adopter.id,
        ong_id: ongId,
        status: 'completed',
        completed_at: new Date('2026-05-01'),
        created_at: new Date('2026-04-15'),
        updated_at: new Date('2026-05-01'),
      },
    ];

    const secondAnimal = await knex('animals')
      .whereNot({ id: animal.id })
      .where({ ong_id: ongId })
      .first();

    if (secondAnimal) {
      seedAdoptions.push({
        id: 'a0a00001-0001-4001-a001-000000000002',
        animal_id: secondAnimal.id,
        adopter_id: adopter.id,
        ong_id: ongId,
        status: 'completed',
        completed_at: new Date('2026-04-15'),
        created_at: new Date('2026-04-01'),
        updated_at: new Date('2026-04-15'),
      });
    }

    for (const adoption of seedAdoptions) {
      const exists = await knex('adoption_requests').where({ id: adoption.id }).first();
      if (!exists) {
        await knex('adoption_requests').insert(adoption);
        await knex('animals').where({ id: adoption.animal_id }).update({ status: 'adopted' });
        console.log(`[Seed] Adoção criada: ${adoption.id}`);
      }
    }

    completedAdoptions = seedAdoptions.map((a) => ({
      id: a.id,
      ong_id: a.ong_id,
      completed_at: a.completed_at,
    }));
  }

  for (const adoption of completedAdoptions) {
    const adoptionDate = new Date(adoption.completed_at);

    const reminders = [
      {
        id: crypto.randomUUID(),
        adoption_request_id: adoption.id,
        ong_id: adoption.ong_id,
        reminder_number: 1,
        due_date: addDays(adoptionDate, 30),
        status: getStatus(addDays(adoptionDate, 30)),
        created_at: adoptionDate,
        updated_at: new Date(),
      },
      {
        id: crypto.randomUUID(),
        adoption_request_id: adoption.id,
        ong_id: adoption.ong_id,
        reminder_number: 2,
        due_date: addDays(adoptionDate, 60),
        status: getStatus(addDays(adoptionDate, 60)),
        created_at: adoptionDate,
        updated_at: new Date(),
      },
      {
        id: crypto.randomUUID(),
        adoption_request_id: adoption.id,
        ong_id: adoption.ong_id,
        reminder_number: 3,
        due_date: addDays(adoptionDate, 90),
        status: getStatus(addDays(adoptionDate, 90)),
        created_at: adoptionDate,
        updated_at: new Date(),
      },
    ];

    await knex('follow_up_reminders').insert(reminders);
    console.log(`[Seed] Criados 3 lembretes para adoção ${adoption.id}`);
  }
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function getStatus(dueDate: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  if (due < today) return 'overdue';
  return 'pending';
}
