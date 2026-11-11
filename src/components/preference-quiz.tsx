"use client";
import { useState } from "react";
const questions = [
  {
    axis: 0,
    left: "E",
    right: "I",
    text: "새 활동을 고를 때 생각을 정리하기 편한 방법은?",
    a: "누군가와 이야기하며 선택지를 만든다",
    b: "혼자 적어본 뒤 의견을 나눈다",
  },
  {
    axis: 0,
    left: "E",
    right: "I",
    text: "막힌 아이디어를 다시 움직이게 하는 방법은?",
    a: "밖의 사람이나 활동에서 자극을 얻는다",
    b: "조용히 생각할 시간을 확보한다",
  },
  {
    axis: 0,
    left: "E",
    right: "I",
    text: "처음 보는 과제를 설명해야 한다면?",
    a: "말해보는 과정에서 생각을 발전시킨다",
    b: "안에서 문장을 정리한 뒤 설명한다",
  },
  {
    axis: 1,
    left: "S",
    right: "N",
    text: "새 서비스를 처음 이해할 때 먼저 보고 싶은 것은?",
    a: "지금 어떻게 쓰는지 보여주는 구체적인 예",
    b: "어떤 필요를 바꾸려는지 설명하는 큰 그림",
  },
  {
    axis: 1,
    left: "S",
    right: "N",
    text: "새 장소의 인상을 메모한다면?",
    a: "관찰한 모습과 실제 있었던 일을 적는다",
    b: "떠오른 연결과 앞으로의 가능성을 적는다",
  },
  {
    axis: 1,
    left: "S",
    right: "N",
    text: "설명이 낯설 때 도움이 되는 질문은?",
    a: "실제 사례를 하나 더 보여줄 수 있나요?",
    b: "이것이 다른 개념과 어떻게 이어지나요?",
  },
  {
    axis: 2,
    left: "T",
    right: "F",
    text: "팀의 일정을 조정할 때 먼저 확인하고 싶은 것은?",
    a: "같은 기준으로 비교한 비용과 효과",
    b: "각 사람에게 생기는 영향과 중요한 가치",
  },
  {
    axis: 2,
    left: "T",
    right: "F",
    text: "서로 다른 제안 사이에서 판단할 때?",
    a: "어떤 원칙이 일관되게 적용되는지 본다",
    b: "각 제안이 지키려는 가치와 사정을 본다",
  },
  {
    axis: 2,
    left: "T",
    right: "F",
    text: "어려운 결정을 설명할 때 먼저 준비하는 말은?",
    a: "그 결론에 이른 근거와 판단 기준",
    b: "소중히 여긴 가치와 사람에게 미칠 영향",
  },
  {
    axis: 3,
    left: "J",
    right: "P",
    text: "비어 있는 하루를 보낼 때 편안한 상태는?",
    a: "대략의 순서와 끝낼 일이 정해진 상태",
    b: "그날 발견한 것에 따라 바꿀 여지가 있는 상태",
  },
  {
    axis: 3,
    left: "J",
    right: "P",
    text: "선택에 필요한 정보를 충분히 얻었다면?",
    a: "방향을 정하고 다음 단계로 간다",
    b: "새 정보가 나올 여지를 잠시 더 둔다",
  },
  {
    axis: 3,
    left: "J",
    right: "P",
    text: "작은 공동 작업을 시작할 때 편안한 방식은?",
    a: "중간 점검과 완료 시점을 먼저 정한다",
    b: "시도하며 상황에 맞게 진행 방식을 정한다",
  },
] as const;
export default function PreferenceQuiz({
  onSelect,
}: {
  onSelect: (type: string) => void;
}) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const complete = Object.keys(answers).length === questions.length;
  const result = [0, 1, 2, 3]
    .map((axis) => {
      const group = questions
        .map((q, i) => ({ ...q, i }))
        .filter((q) => q.axis === axis);
      return group.filter((q) => answers[q.i] === q.left).length >= 2
        ? group[0].left
        : group[0].right;
    })
    .join("");
  return (
    <details className="preference-quiz">
      <summary>MBTI를 모른다면 · 간단한 성향 살펴보기</summary>
      <p className="small muted">
        나읽기가 작성한 12개의 생활 질문입니다. 공식 MBTI 검사가 아니며 유형을
        확정하지 않아요. 지금 더 편한 쪽을 선택하세요.
      </p>
      {questions.map((q, i) => (
        <fieldset key={i}>
          <legend>
            {i + 1}. {q.text}
          </legend>
          {[
            [q.left, q.a],
            [q.right, q.b],
          ].map(([letter, label]) => (
            <label className="checkbox-row" key={letter}>
              <input
                type="radio"
                name={`preference-${i}`}
                checked={answers[i] === letter}
                onChange={() => setAnswers((old) => ({ ...old, [i]: letter }))}
              />
              {label}
            </label>
          ))}
        </fieldset>
      ))}
      {complete ? (
        <div className="notice">
          <strong>지금의 응답과 가까운 조합: {result}</strong>
          <p className="small">
            상황에 따라 달라질 수 있는 참고 결과예요. 설명이 맞는지 살펴본 뒤
            사용할지 선택할 수 있어요.
          </p>
          <button
            type="button"
            className="button secondary"
            onClick={() => onSelect(result)}
          >
            이 참고 유형으로 살펴보기
          </button>
        </div>
      ) : (
        <p className="small muted">{Object.keys(answers).length}/12개 응답</p>
      )}
    </details>
  );
}
