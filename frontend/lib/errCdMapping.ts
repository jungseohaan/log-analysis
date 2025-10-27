/**
 * errCd와 설명을 매핑하는 객체
 * 키: errCd 값
 * 값: 에러 설명
 */
export const errCdMap: Record<string, string> = {
  // API/쿼리 지연
  ERRDLAY001: "API 호출 완료 까지 10초 이상 지연",
  ERRDLAY002: "쿼리 호출 완료 까지 10초 이상 지연",

  // Try-Catch 오류
  ERRTRYC001: "try catch 에서 걸러진 default 오류",

  // 인증 오류
  ERRAUTH001: "auth-login.json 에서 인증 오류 발생 시 등록",
  ERRAUTH002: "socket-login.json 에서 인증 오류 발생 시 등록",

  // JWT 토큰 관련
  ERRSOCK001: "JwtToken 갱신 시도 10회 실패",

  // 소켓 연결 오류
  ERRSOCK002: "소켓으로부터 reconnect-fail 메시지 수신 (7/11 배포 이후 ERRSOCK006, ERRSOCK007로 세분화되어 발생되지 않음)",
  ERRSOCK003: "소켓으로부터 notifyError 수신",
  ERRSOCK004: "소켓 연결 끊김 확인",
  ERRSOCK005: "네트워크 연결 끊어짐 case 1",
  ERRSOCK006: "소켓으로부터 reconnect-fail 메시지 수신",
  ERRSOCK007: "소켓으로부터 reconnect-fail-not-found-user 메시지 수신",
  ERRSOCK008: "토큰시간 만료 (7/11 배포 이후 token 갱신로직이 주석처리되어 발생되지 않음)",
  ERRSOCK009: "focus out > 50분 미사용 > focus in",
  ERRSOCK010: "reconnect 시도 시 jwt token이 없을경우",

  // 성능 오류
  ERRPERF001: "런처 메인화면 진입시 3초이상 로딩이 되지 않은 경우",

  // 평가 교과서 제출 오류
  ERRTRACE001: "평가 교과서 제출 오류. 응답값이 Reset 되고, DB에 저장되지 않음",
  ERRTRACE002: "평가 교과서 제출 오류. 응답값이 Reset 되고, DB에 저장되지 않음",
};

/**
 * errCd를 받아서 설명을 반환하는 함수
 * @param errCd - 에러 코드
 * @returns 에러 설명 (매핑이 없으면 원본 errCd 반환)
 */
export function getErrCdDescription(errCd: string): string {
  return errCdMap[errCd] || errCd;
}
