export function ControlHint() {
  return (
    <div className="ui-panel control-hint">
      <div className="ui-panel__title control-hint__title">Управление камерой</div>
      <ul className="control-hint__list">
        <li className="control-hint__item">
          <b className="control-hint__action">Повернуть:</b> зажмите правую кнопку мыши и двигайте влево-вправо
        </li>
        <li className="control-hint__item">
          <b className="control-hint__action">Наклонить:</b> зажмите правую кнопку - двигайте вверх-вниз
        </li>
        <li className="control-hint__item">
          <b className="control-hint__action">Приблизить:</b> крутите колесо мыши
        </li>
        <li className="control-hint__item">
          <b className="control-hint__action">Переместить:</b> зажмите пробел и левую кнопку мыши, двигайте
        </li>
      </ul>
    </div>
  );
}
