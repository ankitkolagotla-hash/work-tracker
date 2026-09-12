import { NextResponse } from 'next/server';
import { REGISTERED_COURSES } from '@/types/assessment';
import { generateStudyPack } from '@/lib/studyGenerator';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    const targetUrl =
      url ||
      'https://issaquah.instructure.com/feeds/calendars/user_QeloAEpfBFMRDzKfi2PNj6w6C236vTQofVfALMl0.ics';

    const response = await fetch(targetUrl);
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch calendar' }, { status: 500 });
    }

    const icsData = await response.text();
    const events = [];
    const eventBlocks = icsData.split('BEGIN:VEVENT');

    for (let i = 1; i < eventBlocks.length; i++) {
      const block = eventBlocks[i];
      const summaryMatch = block.match(/SUMMARY:(.*)/);
      const dtendMatch = block.match(/DTEND.*:(\d{8}T\d{6}Z?)/);
      const descMatch = block.match(/DESCRIPTION:(.*)/);

      if (summaryMatch && dtendMatch) {
        const summary = summaryMatch[1].trim();
        const rawDate = dtendMatch[1];
        const formattedDate = `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}T${rawDate.slice(9, 11)}:${rawDate.slice(11, 13)}:00.000Z`;

        const matchedCourse =
          REGISTERED_COURSES.find(
            (c) =>
              summary.toLowerCase().includes(c.name.toLowerCase()) ||
              summary.toLowerCase().includes(c.code.toLowerCase())
          ) || REGISTERED_COURSES[5];

        const pastedMaterials = descMatch ? descMatch[1].replace(/\\n/g, '\n').replace(/\\/g, '') : '';

        events.push({
          id: `canvas-${i}-${Date.now()}`,
          title: summary,
          type: summary.toLowerCase().includes('quiz') ? 'Quiz' : 'Assignment',
          courseId: matchedCourse.id,
          unitsCovered: ['General Syllabus Unit'],
          dueDate: new Date(formattedDate).toISOString(),
          pastedMaterials,
          status: 'Upcoming',
          difficulty: 'Medium',
          points: 10,
          readinessIndex: 0,
          studyPack: generateStudyPack(pastedMaterials),
          totalPrepTimeMinutes: 60,
          studySessionPacing: '25m Pomodoro',
          targetStudyDays: [],
        });
      }
    }

    return NextResponse.json({ events });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
