import { tokens } from "@fluentui/react-components";
import { Text } from "@fluentui/react-components";
import React, { useEffect, useState } from "react";
import { getCountriesVisitedSummary } from "../../continent/infra/ManagerApi";
import {
  CENTER_Y,
  GAUGE_SIZE,
  RADIUS,
  STROKE_WIDTH,
  useClasses
} from "./CountriesVisitedGauge.styles";
import { CountriesVisitedGaugeProps } from "./CountriesVisitedGauge.types";
import { Flex } from "../../../shared/ui/Flex";

const describeArc = (
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
): string => {
  const toRad = (deg: number): number => ((deg - 90) * Math.PI) / 180;
  const startX = cx + r * Math.cos(toRad(startAngle));
  const startY = cy + r * Math.sin(toRad(startAngle));
  const endX = cx + r * Math.cos(toRad(endAngle));
  const endY = cy + r * Math.sin(toRad(endAngle));
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${startX} ${startY} A ${r} ${r} 0 ${largeArc} 1 ${endX} ${endY}`;
};

export const CountriesVisitedGauge: React.FunctionComponent<
  CountriesVisitedGaugeProps
> = ({ visitedCount, totalCount }) => {
  const classes = useClasses();
  const [visited, setVisited] = useState<number>(visitedCount ?? 0);
  const [total, setTotal] = useState<number>(totalCount ?? 0);

  useEffect(() => {
    if (visitedCount !== undefined && totalCount !== undefined) return;
    getCountriesVisitedSummary().then((summary) => {
      setVisited(summary.visitedCount);
      setTotal(summary.totalCount);
    });
  }, [visitedCount, totalCount]);

  const START_ANGLE = -90;
  const END_ANGLE = 90;
  const TOTAL_SWEEP = END_ANGLE - START_ANGLE;
  const filledAngle =
    total > 0 ? START_ANGLE + (visited / total) * TOTAL_SWEEP : START_ANGLE;

  const trackPath = describeArc(
    CENTER_Y,
    CENTER_Y,
    RADIUS,
    START_ANGLE,
    END_ANGLE
  );
  const filledPath =
    visited > 0
      ? describeArc(CENTER_Y, CENTER_Y, RADIUS, START_ANGLE, filledAngle)
      : "";

  return (
    <Flex justify="center" gap={0}>
      <div className={classes.svgContainer}>
        <svg
          width={GAUGE_SIZE}
          height={CENTER_Y + STROKE_WIDTH}
          viewBox={`0 0 ${GAUGE_SIZE} ${CENTER_Y + STROKE_WIDTH}`}
        >
          <path
            d={trackPath}
            fill="none"
            stroke={tokens.colorNeutralBackground1}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
          />
          {filledPath && (
            <path
              d={filledPath}
              fill="none"
              stroke={tokens.colorBrandBackground}
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
            />
          )}
        </svg>
        <div className={classes.labelContainer}>
          <Text size={400} className={classes.valueText}>
            {visited} of {total}
          </Text>
        </div>
      </div>
      <Text size={100} className={classes.subtitleText}>
        Countries visited
      </Text>
    </Flex>
  );
};

export default CountriesVisitedGauge;
